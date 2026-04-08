const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const rbac = require('../middleware/rbac');
const { uploadRateLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(authMiddleware);

// HR & Super User only guard
const hrAdminOnly = rbac(['super_user', 'hr']);

// ── GET /api/documents  — list all documents
router.get('/', hrAdminOnly, documentController.getAllDocuments);

// ── POST /api/documents/upload  — upload a file
router.post(
    '/upload',
    hrAdminOnly,
    uploadRateLimiter,
    upload.single('file'),
    documentController.uploadDocument
);

// ── GET /api/documents/view/:documentId  — secure stream/proxy
// IMPORTANT: must be before /:entityType/:entityId to avoid route collision
router.get('/view/:documentId', hrAdminOnly, documentController.viewDocumentProxy);

// ── GET /api/documents/:entityType/:entityId  — docs for a specific entity
router.get('/:entityType/:entityId', hrAdminOnly, documentController.getDocumentsByEntity);

// ── DELETE /api/documents/:documentId  — soft delete
router.delete('/:documentId', hrAdminOnly, documentController.deleteDocument);

module.exports = router;
