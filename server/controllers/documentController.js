const mongoose = require('mongoose');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const storageService = require('../services/storageService');
const slugify = require('slugify');

// Only pass entityId to AuditLog when it is a valid ObjectId
const safeEntityId = (id) =>
    mongoose.Types.ObjectId.isValid(id) ? id : undefined;

/**
 * Wraps async functions to catch errors and pass them to Express error handlers
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Checks if the storage provider is configured.
 * Returns true if configured, false otherwise.
 */
const isStorageConfigured = () => {
    const provider = process.env.STORAGE_PROVIDER || 'drive';
    if (provider === 'drive') {
        return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
    }
    if (provider === 'dropbox') {
        return !!process.env.DROPBOX_ACCESS_TOKEN;
    }
    return false;
};

// 0. Get ALL Documents (for admin/hr listing page)
exports.getAllDocuments = catchAsync(async (req, res) => {
    const documents = await Document.find({ isDeleted: false })
        .populate('uploadedBy', 'name email')
        .sort({ uploadedAt: -1 });

    res.status(200).json({
        success: true,
        storageConfigured: isStorageConfigured(),
        data: documents
    });
});

// 1. Upload Document
exports.uploadDocument = catchAsync(async (req, res) => {
    // Check storage config first
    if (!isStorageConfigured()) {
        return res.status(503).json({
            success: false,
            code: 'STORAGE_NOT_CONFIGURED',
            message: `Storage provider is not configured. Please set ${
                (process.env.STORAGE_PROVIDER || 'drive') === 'drive'
                    ? 'GOOGLE_SERVICE_ACCOUNT_KEY_JSON'
                    : 'DROPBOX_ACCESS_TOKEN'
            } in your server .env file.`
        });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded', code: 'NO_FILE' });
    }

    const { entityType = 'general', entityId = 'general', label, description } = req.body;

    // Sanitize filename
    const originalName = req.file.originalname;
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    const safeName = slugify(baseName, { lower: true, strict: true }) + ext;
    
    // Attempt upload to storage provider
    const { fileId, viewLink } = await storageService.uploadFile(
        req.file.buffer, 
        safeName, 
        req.file.mimetype
    );

    // Create record in DB
    const newDoc = await Document.create({
        entityType,
        entityId,
        label: label || originalName,
        description: description || '',
        originalName,
        safeName,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storageProvider: process.env.STORAGE_PROVIDER || 'drive',
        storageFileId: fileId,
        viewLink,
        uploadedBy: req.user.id
    });

    // Populate uploader info for the response
    await newDoc.populate('uploadedBy', 'name email');

    // Log action
    await AuditLog.create({
        action: 'upload',
        performedBy: req.user.id,
        documentId: newDoc._id,
        entityType,
        entityId: safeEntityId(entityId),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: newDoc
    });
});

// 2. Get Documents by Entity
exports.getDocumentsByEntity = catchAsync(async (req, res) => {
    const { entityType, entityId } = req.params;

    const documents = await Document.find({ 
        entityType, 
        entityId, 
        isDeleted: false 
    }).populate('uploadedBy', 'name email').sort({ uploadedAt: -1 });

    res.status(200).json({
        success: true,
        data: documents
    });
});

// 3. View Document (Secure Proxy Stream)
exports.viewDocumentProxy = catchAsync(async (req, res) => {
    const { documentId } = req.params;

    if (!isStorageConfigured()) {
        return res.status(503).json({
            success: false,
            code: 'STORAGE_NOT_CONFIGURED',
            message: 'Storage provider is not configured on the server.'
        });
    }

    const document = await Document.findOne({ _id: documentId, isDeleted: false });

    if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found', code: 'NOT_FOUND' });
    }

    // Set correct headers for inline viewing
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);

    // Stream file from storage
    await storageService.streamFile(document.storageFileId, res, document.mimeType);

    // Log view action (fire-and-forget)
    AuditLog.create({
        action: 'view',
        performedBy: req.user.id,
        documentId: document._id,
        entityType: document.entityType,
        entityId: safeEntityId(document.entityId),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    }).catch(console.error);
});

// 4. Delete Document (Soft delete DB, hard delete storage)
exports.deleteDocument = catchAsync(async (req, res) => {
    const { documentId } = req.params;

    const document = await Document.findOne({ _id: documentId, isDeleted: false });

    if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found', code: 'NOT_FOUND' });
    }

    // Attempt hard delete from storage (non-fatal if storage not configured)
    if (document.storageFileId && isStorageConfigured()) {
        try {
            await storageService.deleteFile(document.storageFileId);
        } catch (err) {
            console.warn('Storage delete failed (soft delete will still proceed):', err.message);
        }
    }

    // Soft delete in DB
    document.isDeleted = true;
    document.deletedAt = Date.now();
    await document.save();

    // Log action
    await AuditLog.create({
        action: 'delete',
        performedBy: req.user.id,
        documentId: document._id,
        entityType: document.entityType,
        entityId: safeEntityId(document.entityId),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
    });
});
