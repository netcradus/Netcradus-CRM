const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadRateLimiter, viewDownloadRateLimiter } = require('../middleware/rateLimiter');

// ─── All routes require JWT authentication ────────────────────────────────────
router.use(authMiddleware);

// ─── Super user guard ─────────────────────────────────────────────────────────
const superUserOnly = (req, res, next) => {
  if (req.user?.role !== 'super_user') {
    return res.status(403).json({ success: false, message: 'Super user access required.', code: 'FORBIDDEN' });
  }
  next();
};

const superUserOrCoo = (req, res, next) => {
  if (req.user?.role !== 'super_user' && req.user?.role !== 'coo') {
    return res.status(403).json({ success: false, message: 'Super user or COO access required.', code: 'FORBIDDEN' });
  }
  next();
};

const superUserOrCooOrHr = (req, res, next) => {
  const allowed = ['super_user', 'coo', 'hr'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Super user, COO or HR access required.', code: 'FORBIDDEN' });
  }
  next();
};

// ─── Employee routes (any authenticated user — own data only) ─────────────────

// Storage info
router.get('/storage', ctrl.getMyStorage);

// File listing
router.get('/files', ctrl.getMyFiles);

// File upload (rate limited)
router.post('/upload', uploadRateLimiter, upload.single('file'), ctrl.uploadFile);

// Employee document routes
router.get('/employee/:userId', superUserOrCooOrHr, ctrl.getEmployeeDocuments);
router.post('/upload/:userId', superUserOrCooOrHr, uploadRateLimiter, upload.single('document'), ctrl.uploadEmployeeDocument);

// View file inline (proxy — never exposes raw Drive URL)
router.get('/view/:documentId', viewDownloadRateLimiter, ctrl.viewFile);

// Download file as attachment
router.get('/download/:documentId', viewDownloadRateLimiter, ctrl.downloadFile);

// Rename file (DB only)
router.patch('/:documentId/rename', ctrl.renameFile);

// Move file to different folder
router.patch('/:documentId/move', ctrl.moveFile);

// Delete file
router.delete('/:documentId', ctrl.deleteFile);

// Verify file
router.patch('/:documentId/verify', ctrl.verifyDocument);

// Folder management
router.post('/folders', ctrl.createFolder);
router.delete('/folders/:folderName', ctrl.deleteFolder);

// ─── Super user only routes ───────────────────────────────────────────────────

// All user storage overview
router.get('/admin/storage', superUserOrCoo, ctrl.getAllUsersStorage);

// View any user's files
router.get('/admin/user/:userId/files', superUserOrCoo, ctrl.getUserFiles);

// Update quota
router.patch('/admin/user/:userId/quota', superUserOnly, ctrl.updateUserQuota);

// Retry Drive provisioning for a user with storageProvisioned === false
router.post('/admin/user/:userId/provision', superUserOnly, ctrl.provisionUserStorage);

module.exports = router;
