const mongoose = require('mongoose');
const Document = require('../models/Document');
const UserStorage = require('../models/UserStorage');
const User = require('../models/User');
const Client = require('../models/Client');
const AuditLog = require('../models/AuditLog');
const storageService = require('../services/storageService');
const driveService = require('../services/driveService');
const { createNotifications } = require('../services/taskNotificationService');
const { isDriveEnabled } = require('../utils/featureFlags');

/**
 * Wraps async route handlers to forward errors to Express error middleware.
 */
const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Strips internal Drive fields before sending a Document to the frontend. */
const sanitizeDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.driveFileId;
  delete obj.driveViewLink;
  return obj;
};

const getEffectiveUserId = (req) => {
  if (req.user && ['super_user', 'admin', 'hr', 'coo'].includes(req.user.role)) {
    return req.query?.userId || req.body?.userId || req.user.id;
  }
  return req.user?.id;
};

const hasDocumentAccess = async (doc, user) => {
  const isSuperUser = user.role === 'super_user';
  const isOwner = String(doc.ownerId) === String(user.id);
  const isAdminOrHR = ['admin', 'coo', 'hr'].includes(user.role);

  if (isSuperUser || isOwner || isAdminOrHR) {
    return true;
  }

  // Check if document is linked to a published Policy that applies to this user
  const Policy = require('../models/Policy');
  const policy = await Policy.findOne({
    "attachments.documentId": doc._id,
    status: "published"
  });

  if (policy) {
    if (policy.applicableToAll) return true;
    const matchesDept = policy.applicableDepartments?.includes(user.department);
    const matchesRole = policy.applicableRoles?.includes(user.role);
    return !!(matchesDept || matchesRole);
  }

  return false;
};

// ─── GET /api/documents/storage ──────────────────────────────────────────────

/**
 * Returns the authenticated user's storage info.
 */
exports.getMyStorage = catchAsync(async (req, res) => {
  const effectiveUserId = getEffectiveUserId(req);
  const storage = await storageService.getUserStorage(effectiveUserId);
  const usedPercent = storage.quotaMB > 0
    ? parseFloat(((storage.usedMB / storage.quotaMB) * 100).toFixed(2))
    : 0;
  const remainingMB = parseFloat((storage.quotaMB - storage.usedMB).toFixed(4));

  res.json({
    success: true,
    data: {
      ...storage.toObject(),
      usedPercent,
      remainingMB,
    },
  });
});

// ─── GET /api/documents/files ─────────────────────────────────────────────────

/**
 * Returns paginated file list for the authenticated user.
 * Query: ?folderId=&page=1&limit=20&search=&mimeType=
 */
exports.getMyFiles = catchAsync(async (req, res) => {
  const { folderId, page = 1, limit = 20, search, mimeType } = req.query;
  const effectiveUserId = getEffectiveUserId(req);

  const query = { ownerId: effectiveUserId, isDeleted: false };
  if (folderId) query.folderId = folderId;
  if (mimeType)  query.mimeType = { $regex: mimeType, $options: 'i' };
  if (search) {
    query.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { safeName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [docs, total] = await Promise.all([
    Document.find(query).sort({ uploadedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Document.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: docs.map(d => {
      const { driveFileId, driveViewLink, ...safe } = d;
      return safe;
    }),
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─── POST /api/documents/upload ───────────────────────────────────────────────

/**
 * Uploads a file to the authenticated user's specified folder.
 * Body: multipart { file, folderId, entityType?, entityId? }
 */
exports.uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.', code: 'NO_FILE' });
  }

  const { folderId, entityType, entityId, documentType, notes } = req.body;
  if (!folderId) {
    return res.status(400).json({ success: false, message: 'folderId is required.', code: 'NO_FOLDER' });
  }
  const effectiveUserId = getEffectiveUserId(req);

  const doc = await storageService.uploadToFolder(
    effectiveUserId,
    folderId,
    req.file,
    entityType || null,
    entityId || null,
    documentType || null,
    notes || null
  );

  // Audit
  AuditLog.create({
    action: 'DOCUMENT_UPLOAD',
    performedBy: req.user.id,
    documentId: doc._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully.',
    data: sanitizeDoc(doc),
  });
});

// ─── GET /api/documents/view/:documentId ──────────────────────────────────────

/**
 * Streams a file inline for viewing. Logs the view action.
 */
exports.viewFile = catchAsync(async (req, res) => {
  const { documentId } = req.params;

  const doc = await Document.findOne({ _id: documentId, isDeleted: false });
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.', code: 'NOT_FOUND' });
  }

  const access = await hasDocumentAccess(doc, req.user);
  if (!access) {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this document.', code: 'FORBIDDEN' });
  }

  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  if (doc.fileSizeBytes) {
    res.setHeader('Content-Length', doc.fileSizeBytes);
  }

  const rawName = doc.originalName || doc.name || doc.fileName || 'attachment';
  const sanitized = rawName.replace(/"/g, '');
  const encoded = encodeURIComponent(sanitized);
  res.setHeader('Content-Disposition', `inline; filename="${sanitized}"; filename*=UTF-8''${encoded}`);

  if (!isDriveEnabled()) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join('./uploads/documents', doc.driveFileId);
    if (fs.existsSync(filePath)) {
      fs.createReadStream(filePath).pipe(res);
    } else {
      return res.status(404).json({ success: false, message: 'Local file not found.' });
    }
  } else {
    // Stream from Drive
    await driveService.streamFile(doc.driveFileId, res);
  }

  // Log view (fire-and-forget)
  AuditLog.create({
    action: 'DOCUMENT_VIEW',
    performedBy: req.user.id,
    documentId: doc._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch(console.error);
});

// ─── GET /api/documents/download/:documentId ──────────────────────────────────

/**
 * Downloads a file as an attachment.
 */
exports.downloadFile = catchAsync(async (req, res) => {
  const { documentId } = req.params;

  const doc = await Document.findOne({ _id: documentId, isDeleted: false });
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.', code: 'NOT_FOUND' });
  }

  const access = await hasDocumentAccess(doc, req.user);
  if (!access) {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this document.', code: 'FORBIDDEN' });
  }

  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  if (doc.fileSizeBytes) {
    res.setHeader('Content-Length', doc.fileSizeBytes);
  }

  const rawName = doc.originalName || doc.name || doc.fileName || 'attachment';
  const sanitized = rawName.replace(/"/g, '');
  const encoded = encodeURIComponent(sanitized);
  res.setHeader('Content-Disposition', `attachment; filename="${sanitized}"; filename*=UTF-8''${encoded}`);

  if (!isDriveEnabled()) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join('./uploads/documents', doc.driveFileId);
    if (fs.existsSync(filePath)) {
      fs.createReadStream(filePath).pipe(res);
    } else {
      return res.status(404).json({ success: false, message: 'Local file not found.' });
    }
  } else {
    await driveService.streamFile(doc.driveFileId, res);
  }

  AuditLog.create({
    action: 'DOCUMENT_DOWNLOAD',
    performedBy: req.user.id,
    documentId: doc._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch(console.error);
});

// ─── DELETE /api/documents/:documentId ────────────────────────────────────────

exports.deleteFile = catchAsync(async (req, res) => {
  const isSuperUser = req.user.role === 'super_user';

  await storageService.deleteDocument(
    req.user.id,
    req.params.documentId,
    req.user.id,
    isSuperUser
  );

  AuditLog.create({
    action: 'DOCUMENT_DELETE',
    performedBy: req.user.id,
    documentId: req.params.documentId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch(console.error);

  res.json({ success: true, message: 'File deleted successfully.' });
});

// ─── PATCH /api/documents/:documentId/rename ──────────────────────────────────

/**
 * Renames a document (DB-only — Drive name is not changed).
 */
exports.renameFile = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const { newName } = req.body;

  if (!newName || !String(newName).trim()) {
    return res.status(400).json({ success: false, message: 'newName is required.', code: 'NO_NAME' });
  }

  const isSuperUser = req.user.role === 'super_user';
  const query = isSuperUser
    ? { _id: documentId, isDeleted: false }
    : { _id: documentId, ownerId: req.user.id, isDeleted: false };

  const doc = await Document.findOne(query);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.', code: 'NOT_FOUND' });
  }

  doc.originalName = String(newName).trim().substring(0, 200);
  await doc.save();

  res.json({ success: true, message: 'File renamed.', data: sanitizeDoc(doc) });
});

// ─── PATCH /api/documents/:documentId/move ────────────────────────────────────

/**
 * Moves a document to a different folder within the same user's storage.
 */
exports.moveFile = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const { targetFolderId } = req.body;

  if (!targetFolderId) {
    return res.status(400).json({ success: false, message: 'targetFolderId is required.', code: 'NO_TARGET' });
  }

  const isSuperUser = req.user.role === 'super_user';
  const query = isSuperUser ? { _id: documentId, isDeleted: false } : { _id: documentId, ownerId: req.user.id, isDeleted: false };
  const doc = await Document.findOne(query);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.', code: 'NOT_FOUND' });
  }

  // Validate target folder belongs to this doc's owner
  const storage = await storageService.getUserStorage(doc.ownerId);
  const targetFolder = storage.subFolders.find(f => f.driveFolderId === targetFolderId);
  if (!targetFolder) {
    return res.status(403).json({ success: false, message: 'Target folder is not valid.', code: 'INVALID_FOLDER' });
  }

  if (doc.folderId === targetFolderId) {
    return res.status(400).json({ success: false, message: 'File is already in this folder.', code: 'SAME_FOLDER' });
  }

  // Move in Drive
  await driveService.moveFile(doc.driveFileId, doc.folderId, targetFolderId);

  // Update MongoDB
  doc.folderId = targetFolderId;
  doc.folderName = targetFolder.name;
  await doc.save();

  res.json({ success: true, message: 'File moved successfully.', data: sanitizeDoc(doc) });
});

// ─── POST /api/documents/folders ──────────────────────────────────────────────

exports.createFolder = catchAsync(async (req, res) => {
  const { folderName } = req.body;
  const effectiveUserId = getEffectiveUserId(req);
  if (!folderName) {
    return res.status(400).json({ success: false, message: 'folderName is required.', code: 'NO_NAME' });
  }

  const storage = await storageService.createCustomFolder(effectiveUserId, folderName);
  res.status(201).json({ success: true, message: 'Folder created.', data: storage });
});

// ─── DELETE /api/documents/folders/:folderName ────────────────────────────────

exports.deleteFolder = catchAsync(async (req, res) => {
  const effectiveUserId = getEffectiveUserId(req);
  const storage = await storageService.deleteCustomFolder(effectiveUserId, req.params.folderName);
  res.json({ success: true, message: 'Folder deleted.', data: storage });
});

// ─── SUPER USER ───────────────────────────────────────────────────────────────

/**
 * GET /api/documents/admin/storage
 * Returns storage summary for ALL users, paginated.
 */
exports.getAllUsersStorage = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, role, sortBy = 'usedMB' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const matchQuery = role ? { role } : {};
  const users = await User.find(matchQuery)
    .select('_id name email role storageProvisioned')
    .lean();

  const userIds = users.map(u => u._id);
  const storageRecords = await UserStorage.find({ userId: { $in: userIds } }).lean();

  const storageMap = {};
  storageRecords.forEach(s => { storageMap[String(s.userId)] = s; });

  const combined = users.map(u => {
    const s = storageMap[String(u._id)] || {};
    const usedMB = s.usedMB || 0;
    const quotaMB = s.quotaMB || 500;
    return {
      userId: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      storageProvisioned: u.storageProvisioned,
      quotaMB,
      usedMB,
      fileCount: s.fileCount || 0,
      usedPercent: quotaMB > 0 ? parseFloat(((usedMB / quotaMB) * 100).toFixed(2)) : 0,
    };
  });

  // Sort
  const validSortFields = ['usedMB', 'fileCount', 'usedPercent', 'name'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'usedMB';
  combined.sort((a, b) => (b[sortField] > a[sortField] ? 1 : -1));

  const paginated = combined.slice(skip, skip + parseInt(limit));

  // Summary totals
  const totalUsedMB = combined.reduce((sum, u) => sum + u.usedMB, 0);
  const overQuota = combined.filter(u => u.usedPercent >= 80).length;
  const avgUsedPercent = combined.length > 0
    ? parseFloat((combined.reduce((s, u) => s + u.usedPercent, 0) / combined.length).toFixed(2))
    : 0;

  res.json({
    success: true,
    summary: {
      totalUsers: combined.length,
      totalUsedMB: parseFloat(totalUsedMB.toFixed(2)),
      avgUsedPercent,
      usersOverEightyPercent: overQuota,
    },
    data: paginated,
    pagination: {
      total: combined.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(combined.length / parseInt(limit)),
    },
  });
});

/**
 * GET /api/documents/admin/user/:userId/files
 * Super user: view any user's files.
 */
exports.getUserFiles = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { folderId, page = 1, limit = 20, search } = req.query;

  const query = { ownerId: userId, isDeleted: false };
  if (folderId) query.folderId = folderId;
  if (search) {
    query.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { safeName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [docs, total] = await Promise.all([
    Document.find(query).sort({ uploadedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Document.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: docs.map(d => {
      const { driveFileId, driveViewLink, ...safe } = d;
      return safe;
    }),
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

/**
 * PATCH /api/documents/admin/user/:userId/quota
 * Super user: update a user's storage quota.
 */
exports.updateUserQuota = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { newQuotaMB, reason } = req.body;

  if (!newQuotaMB || isNaN(newQuotaMB)) {
    return res.status(400).json({ success: false, message: 'newQuotaMB must be a valid number.', code: 'INVALID_QUOTA' });
  }

  const storage = await storageService.updateQuota(userId, Number(newQuotaMB), req.user.id, reason);

  // Notify the user about their quota increase
  await createNotifications({
    taskId: null,
    userIds: [String(userId)],
    message: `📦 Storage Update: Your storage quota has been increased to ${newQuotaMB}MB by the administrator.`,
    targetPath: '/documents',
  });

  res.json({ success: true, message: 'Quota updated successfully.', data: storage });
});

/**
 * POST /api/documents/admin/user/:userId/provision
 * Super user: retry Drive storage provisioning for a user
 * (used when storageProvisioned === false).
 */
exports.provisionUserStorage = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.', code: 'NOT_FOUND' });
  }

  if (user.storageProvisioned) {
    return res.status(409).json({ success: false, message: 'Storage is already provisioned for this user.', code: 'ALREADY_PROVISIONED' });
  }

  // Check if UserStorage already exists (partial provision)
  const existingStorage = await UserStorage.findOne({ userId });
  if (existingStorage) {
    // Mark as provisioned even if Drive creation had issues
    user.storageProvisioned = true;
    await user.save();
    return res.json({ success: true, message: 'Storage already exists. Marked as provisioned.', data: existingStorage });
  }

  const storage = await storageService.provisionUserStorage(user._id, user.name || user.email, user.role);

  user.storageProvisioned = true;
  await user.save();

  res.status(201).json({ success: true, message: 'Storage provisioned successfully.', data: storage });
});

/**
 * Super User, Admin, or HR: approve or reject a document.
 */
exports.verifyDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const { status } = req.body; // 'Verified' or 'Rejected'

  if (!['Verified', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  // Guard: HR or Admin or Super User or COO only
  if (!['super_user', 'admin', 'hr', 'coo'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Unauthorized action.' });
  }

  const doc = await Document.findById(documentId);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.' });
  }

  doc.status = status;
  await doc.save();

  res.json({ success: true, message: `Document status updated to ${status}.`, data: sanitizeDoc(doc) });
});

/**
 * GET /api/documents/employee/:userId
 * Retrieves all non-deleted documents for the specified employee userId.
 */
exports.getEmployeeDocuments = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const docs = await Document.find({ ownerId: userId, isDeleted: false })
    .sort({ uploadedAt: -1 })
    .lean();

  const safeDocs = docs.map(d => {
    const { driveFileId, driveViewLink, ...safe } = d;
    return safe;
  });
  res.json(safeDocs);
});

/**
 * POST /api/documents/upload/:userId
 * Uploads a document for the specified employee userId into their personal storage space.
 */
exports.uploadEmployeeDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.', code: 'NO_FILE' });
  }

  const { userId } = req.params;
  const { documentType, notes } = req.body;

  const storage = await storageService.getUserStorage(userId);
  const generalFolder = storage.subFolders.find(f => f.name === 'general') || storage.subFolders[0];
  if (!generalFolder) {
    return res.status(400).json({ success: false, message: 'No suitable destination folder found in user storage.', code: 'NO_FOLDER' });
  }
  const folderId = generalFolder.driveFolderId;

  const doc = await storageService.uploadToFolder(
    userId,
    folderId,
    req.file,
    'user',
    userId,
    documentType || null,
    notes || null
  );

  // Log upload audit record
  AuditLog.create({
    action: 'DOCUMENT_UPLOAD',
    performedBy: req.user.id,
    documentId: doc._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully.',
    data: sanitizeDoc(doc),
  });
});

/**
 * GET /api/clients/:clientId/documents
 * List all non-deleted documents uploaded for this client.
 */
exports.getClientDocuments = catchAsync(async (req, res) => {
  const { clientId } = req.params;
  const docs = await Document.find({ entityType: 'Client', entityId: clientId, isDeleted: false })
    .sort({ uploadedAt: -1 })
    .populate('ownerId', 'name email')
    .lean();

  res.json({
    success: true,
    data: docs.map(d => {
      const { driveFileId, driveViewLink, ...safe } = d;
      return safe;
    })
  });
});

/**
 * POST /api/clients/:clientId/documents
 * Upload a document and link it to the client.
 */
exports.uploadClientDocument = catchAsync(async (req, res) => {
  const { clientId } = req.params;
  const { documentType, notes } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.', code: 'NO_FILE' });
  }

  const client = await Client.findById(clientId);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found.' });
  }

  // Resolve user's storage
  const storage = await storageService.getUserStorage(req.user.id);
  const clientDocsFolder = storage.subFolders.find(f => f.name === 'client-docs') ||
                            storage.subFolders.find(f => f.name === 'general') ||
                            storage.subFolders[0];

  if (!clientDocsFolder) {
    return res.status(400).json({ success: false, message: 'No suitable destination folder found in user storage.', code: 'NO_FOLDER' });
  }

  const doc = await storageService.uploadToFolder(
    req.user.id,
    clientDocsFolder.driveFolderId,
    req.file,
    'Client',
    clientId,
    documentType || null,
    notes || null
  );

  // Log upload audit
  await AuditLog.create({
    action: 'DOCUMENT_UPLOAD',
    performedBy: req.user.id,
    documentId: doc._id,
    details: { clientId, originalName: doc.originalName },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully.',
    data: sanitizeDoc(doc)
  });
});

/**
 * PUT /api/clients/:clientId/documents/:documentId
 * Update document details (metadata).
 */
exports.updateClientDocument = catchAsync(async (req, res) => {
  const { clientId, documentId } = req.params;
  const { title, documentType, notes } = req.body;

  const doc = await Document.findOne({ _id: documentId, entityType: 'Client', entityId: clientId, isDeleted: false });
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.' });
  }

  if (title !== undefined) doc.originalName = title;
  if (documentType !== undefined) doc.documentType = documentType;
  if (notes !== undefined) doc.notes = notes;

  await doc.save();

  await AuditLog.create({
    action: 'DOCUMENT_UPDATE',
    performedBy: req.user.id,
    documentId: doc._id,
    details: { clientId, documentId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ success: true, message: 'Document details updated.', data: sanitizeDoc(doc) });
});

/**
 * PATCH /api/clients/:clientId/documents/:documentId/archive
 * Soft delete a client document.
 */
exports.archiveClientDocument = catchAsync(async (req, res) => {
  const { clientId, documentId } = req.params;
  const doc = await Document.findOne({ _id: documentId, entityType: 'Client', entityId: clientId, isDeleted: false });
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.' });
  }

  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.deletedBy = req.user.id;
  await doc.save();

  // Recalculate user storage space
  try {
    const storage = await UserStorage.findOne({ userId: doc.ownerId });
    if (storage) {
      storage.usedMB = Math.max(0, parseFloat((storage.usedMB - doc.fileSizeMB).toFixed(4)));
      storage.fileCount = Math.max(0, storage.fileCount - 1);
      await storage.save();
    }
  } catch (err) {
    console.error(err);
  }

  await AuditLog.create({
    action: 'DOCUMENT_ARCHIVE',
    performedBy: req.user.id,
    documentId: doc._id,
    details: { clientId, documentId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ success: true, message: 'Document archived successfully.' });
});

