const express = require('express');
const router = express.Router();
const { checkDriveHealth } = require('../config/drive');
const authMiddleware = require('../middleware/authMiddleware');
const rbac = require('../middleware/rbac');

/**
 * GET /api/health/drive
 * Restricted to super_user.
 * Performs a lightweight check of the Google Drive connection.
 */
router.get('/drive', authMiddleware, rbac(['super_user']), async (req, res) => {
  const health = await checkDriveHealth();
  
  if (health.status === 'ok') {
    return res.json({
      success: true,
      status: 'ok',
      message: 'Google Drive is connected and operational.',
    });
  }

  res.status(503).json({
    success: false,
    status: 'error',
    message: 'Google Drive connection failed.',
    error: health.message,
  });
});

module.exports = router;
