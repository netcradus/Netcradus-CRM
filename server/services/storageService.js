const slugify = require('slugify');
const UserStorage = require('../models/UserStorage');
const Document = require('../models/Document');
const driveService = require('./driveService');
const { createNotifications } = require('./taskNotificationService');

// ─── Role-based default subfolders ───────────────────────────────────────────
const ROLE_DEFAULT_FOLDERS = {
  super_user:    ['general', 'administration', 'reports', 'archives'],
  admin:         ['general', 'administration', 'reports'],
  hr:            ['general', 'cvs', 'salary-slips', 'contracts', 'onboarding'],
  management:    ['general', 'invoices', 'reports', 'proposals'],
  sales:         ['general', 'proposals', 'client-docs', 'invoices'],
  support:       ['general', 'tickets', 'client-docs'],
  it:            ['general', 'assets', 'licenses', 'technical-docs'],
  digital_media: ['general', 'creatives', 'campaigns', 'brand-assets'],
};

// ─── MIME type whitelist ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Sanitizes a folder name: alphanumeric, hyphens only, max 50 chars.
 */
const sanitizeFolderName = (name = '') => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
};

/**
 * Sends a storage-related in-app notification to a user.
 * @param {string|ObjectId} userId
 * @param {string} message
 * @param {string} targetPath
 */
const notifyUser = async (userId, message, targetPath = '/documents', type = 'general') => {
  try {
    await createNotifications({
      taskId: null,
      userIds: [String(userId)],
      message,
      targetPath,
      type,
    });
  } catch (err) {
    console.error('[StorageService] notifyUser failed:', err.message);
  }
};

// ─── provisionUserStorage ─────────────────────────────────────────────────────

/**
 * Called once when a new user is created.
 * Creates personal root folder + role-based subfolders in Drive,
 * and creates a UserStorage document in MongoDB.
 *
 * @param {string|ObjectId} userId
 * @param {string} fullName - user's display name
 * @param {string} role
 * @returns {Promise<UserStorage>}
 */
const provisionUserStorage = async (userId, fullName, role) => {
  const rootFolderName = driveService.sanitizeDriveName(
    `${String(userId)}_${fullName.replace(/\s+/g, '_')}`
  );

  const rootFolderId_env = process.env.DRIVE_FOLDER_ID;
  if (!rootFolderId_env) throw new Error('DRIVE_FOLDER_ID is not set in environment.');

  let personalRootFolderId = null;
  const createdFolderIds = [];

  try {
    // Create the personal root folder
    const { folderId } = await driveService.createFolder(rootFolderName, rootFolderId_env);
    personalRootFolderId = folderId;
    createdFolderIds.push(folderId);

    // Determine role-based subfolders
    const defaultFolders = ROLE_DEFAULT_FOLDERS[role] || ['general'];

    const subFolders = [];
    for (const folderName of defaultFolders) {
      const { folderId: subId } = await driveService.createFolder(folderName, personalRootFolderId);
      createdFolderIds.push(subId);
      subFolders.push({
        name: folderName,
        driveFolderId: subId,
        isDefault: true,
        createdAt: new Date(),
      });
    }

    // Create UserStorage document in MongoDB
    const userStorage = await UserStorage.create({
      userId,
      personalRootFolderId,
      personalRootFolderName: rootFolderName,
      subFolders,
      quotaMB: 500,
      usedMB: 0,
      fileCount: 0,
    });

    return userStorage;

  } catch (err) {
    // Cleanup: delete any Drive folders that were created before the failure
    console.error('[StorageService] provisionUserStorage failed, cleaning up Drive folders:', err.message);
    for (const fid of createdFolderIds) {
      try {
        await driveService.deleteFile(fid);
      } catch (cleanupErr) {
        console.error(`[StorageService] Cleanup failed for folder ${fid}:`, cleanupErr.message);
      }
    }
    throw err;
  }
};

// ─── getUserStorage ───────────────────────────────────────────────────────────

/**
 * Returns the UserStorage document for a user.
 * @param {string|ObjectId} userId
 * @returns {Promise<UserStorage>}
 */
const getUserStorage = async (userId) => {
  const storage = await UserStorage.findOne({ userId });
  if (!storage) {
    const err = new Error('Storage not provisioned for this user.');
    err.statusCode = 404;
    throw err;
  }
  return storage;
};

// ─── createCustomFolder ───────────────────────────────────────────────────────

/**
 * Creates a custom (user-defined) subfolder inside the user's personal root.
 * @param {string|ObjectId} userId
 * @param {string} folderName
 * @returns {Promise<UserStorage>}
 */
const createCustomFolder = async (userId, folderName) => {
  const cleanName = sanitizeFolderName(folderName);

  if (!cleanName) {
    const err = new Error('Invalid folder name. Use letters, numbers, and hyphens only.');
    err.statusCode = 400;
    throw err;
  }

  const storage = await getUserStorage(userId);

  // Check for duplicate
  const exists = storage.subFolders.some(f => f.name === cleanName);
  if (exists) {
    const err = new Error(`Folder "${cleanName}" already exists.`);
    err.statusCode = 409;
    throw err;
  }

  // Create in Drive
  const { folderId } = await driveService.createFolder(cleanName, storage.personalRootFolderId);

  // Update MongoDB
  storage.subFolders.push({
    name: cleanName,
    driveFolderId: folderId,
    isDefault: false,
    createdAt: new Date(),
  });

  await storage.save();
  return storage;
};

// ─── deleteCustomFolder ───────────────────────────────────────────────────────

/**
 * Deletes a custom subfolder from Drive and removes it from UserStorage.
 * Only custom (non-default) folders can be deleted.
 * Folder must be empty (no active documents).
 * @param {string|ObjectId} userId
 * @param {string} folderName
 * @returns {Promise<UserStorage>}
 */
const deleteCustomFolder = async (userId, folderName) => {
  const storage = await getUserStorage(userId);

  const folder = storage.subFolders.find(f => f.name === folderName);

  if (!folder) {
    const err = new Error('Folder not found.');
    err.statusCode = 404;
    throw err;
  }

  if (folder.isDefault) {
    const err = new Error('Default folders cannot be deleted.');
    err.statusCode = 403;
    throw err;
  }

  // Check if folder has active documents
  const docCount = await Document.countDocuments({
    ownerId: userId,
    folderId: folder.driveFolderId,
    isDeleted: false,
  });

  if (docCount > 0) {
    const err = new Error(`Cannot delete folder: it contains ${docCount} file(s). Please delete the files first.`);
    err.statusCode = 409;
    throw err;
  }

  // Delete the actual Drive folder
  await driveService.deleteFile(folder.driveFolderId);

  // Remove from subFolders array
  storage.subFolders = storage.subFolders.filter(f => f.name !== folderName);
  await storage.save();

  return storage;
};

// ─── uploadToFolder ───────────────────────────────────────────────────────────

/**
 * Uploads a file to a specific folder in the user's Drive space.
 * @param {string|ObjectId} userId
 * @param {string} folderId - Drive folder ID (must belong to this user)
 * @param {object} file - Multer file object { buffer, originalname, mimetype, size }
 * @param {string|null} entityType
 * @param {string|ObjectId|null} entityId
 * @returns {Promise<Document>}
 */
const uploadToFolder = async (userId, folderId, file, entityType = null, entityId = null) => {
  const storage = await getUserStorage(userId);

  // Validate folder ownership (prevent folder ID injection)
  const folder = storage.subFolders.find(f => f.driveFolderId === folderId);
  if (!folder) {
    const err = new Error('Invalid folder: the specified folder does not belong to your account.');
    err.statusCode = 403;
    throw err;
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const err = new Error('File type not allowed. Please upload images, PDFs, Office documents, or text files.');
    err.statusCode = 400;
    throw err;
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const err = new Error('File exceeds the 50MB size limit.');
    err.statusCode = 413;
    throw err;
  }

  // Validate quota
  const fileSizeMB = file.size / (1024 * 1024);
  if (storage.usedMB + fileSizeMB > storage.quotaMB) {
    const err = new Error('Storage quota exceeded. Please raise a ticket to request more space.');
    err.statusCode = 413;
    throw err;
  }

  // Sanitize filename
  const ext = file.originalname.includes('.')
    ? file.originalname.substring(file.originalname.lastIndexOf('.'))
    : '';
  const baseName = file.originalname.includes('.')
    ? file.originalname.substring(0, file.originalname.lastIndexOf('.'))
    : file.originalname;
  const safeName = slugify(baseName, { lower: true, strict: true }) + ext;

  // Upload to Drive
  const { driveFileId, driveViewLink } = await driveService.uploadFile(
    file.buffer,
    safeName,
    file.mimetype,
    folderId
  );

  // Create Document record
  const doc = await Document.create({
    ownerId: userId,
    folderId,
    folderName: folder.name,
    originalName: file.originalname,
    safeName,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    fileSizeMB,
    driveFileId,
    driveViewLink,
    entityType: entityType || null,
    entityId: entityId || null,
  });

  // Update UserStorage counters
  storage.usedMB = parseFloat((storage.usedMB + fileSizeMB).toFixed(4));
  storage.fileCount += 1;
  await storage.save();

  // Notify user if storage is >= 90% full
  const usedPercent = (storage.usedMB / storage.quotaMB) * 100;
  if (usedPercent >= 90) {
    await notifyUser(
      userId,
      `⚠️ Storage Alert: You are using ${usedPercent.toFixed(1)}% of your ${storage.quotaMB}MB quota. Raise a ticket to request more space.`,
      '/documents',
      'storage_low'
    );
  }

  return doc;
};

// ─── deleteDocument ───────────────────────────────────────────────────────────

/**
 * Deletes a file from Drive (hard) and soft-deletes the Document record in MongoDB.
 * MongoDB is only updated AFTER Drive deletion confirms success.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} documentId
 * @param {string|ObjectId} deletedBy - ID of the user performing the delete
 * @param {boolean} isSuperUser - if true, ownership check is skipped
 * @returns {Promise<{ success: true }>}
 */
const deleteDocument = async (userId, documentId, deletedBy, isSuperUser = false) => {
  const query = isSuperUser
    ? { _id: documentId, isDeleted: false }
    : { _id: documentId, ownerId: userId, isDeleted: false };

  const doc = await Document.findOne(query);
  if (!doc) {
    const err = new Error('Document not found or already deleted.');
    err.statusCode = 404;
    throw err;
  }

  // Hard delete from Drive FIRST — if this fails, we do NOT touch MongoDB
  await driveService.deleteFile(doc.driveFileId);

  // Only now soft-delete in MongoDB
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.deletedBy = deletedBy;
  await doc.save();

  // Update storage counters (only if we own the storage record)
  const ownerId = isSuperUser ? doc.ownerId : userId;
  try {
    const storage = await UserStorage.findOne({ userId: ownerId });
    if (storage) {
      storage.usedMB = Math.max(0, parseFloat((storage.usedMB - doc.fileSizeMB).toFixed(4)));
      storage.fileCount = Math.max(0, storage.fileCount - 1);
      await storage.save();
    }
  } catch (err) {
    console.error('[StorageService] Failed to update storage counters after delete:', err.message);
  }

  return { success: true };
};

// ─── updateQuota ──────────────────────────────────────────────────────────────

/**
 * Updates a user's storage quota. Super user only.
 * @param {string|ObjectId} targetUserId
 * @param {number} newQuotaMB
 * @param {string|ObjectId} changedByUserId
 * @param {string} reason
 * @returns {Promise<UserStorage>}
 */
const updateQuota = async (targetUserId, newQuotaMB, changedByUserId, reason) => {
  const storage = await getUserStorage(targetUserId);

  if (newQuotaMB <= storage.usedMB) {
    const err = new Error(`New quota (${newQuotaMB}MB) must be greater than current usage (${storage.usedMB.toFixed(2)}MB).`);
    err.statusCode = 400;
    throw err;
  }

  const previousQuotaMB = storage.quotaMB;
  storage.quotaMB = newQuotaMB;
  storage.quotaHistory.push({
    previousQuotaMB,
    newQuotaMB,
    changedBy: changedByUserId,
    reason: reason || '',
    changedAt: new Date(),
  });

  await storage.save();
  return storage;
};

module.exports = {
  provisionUserStorage,
  getUserStorage,
  createCustomFolder,
  deleteCustomFolder,
  uploadToFolder,
  deleteDocument,
  updateQuota,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
};
