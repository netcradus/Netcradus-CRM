const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const rbac = require('../middleware/rbac');
const rateLimit = require('express-rate-limit');
const {
  punchIn,
  punchOut,
  getToday,
  getMyAttendance,
  getUserAttendance,
  getTeamAttendance,
  applyRegularization,
  getRegularizations,
  approveRegularization,
  rejectRegularization,
  getAttendanceSettings,
  updateAttendanceSettings,
  getTodaySnapshot,
  getPendingActions,
} = require('../controllers/attendanceController');
const {
  monthlyReport,
  exportReport,
  yearlySummary,
} = require('../controllers/reportController');

// Rate limit punch actions: 5 per minute per user
const punchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many punch requests. Please try again in a minute.' },
  keyGenerator: (req) => `punch_${req.user._id}`,
  validate: { keyGeneratorIpFallback: false },
});

// All routes require auth
router.use(authMiddleware);

// Punch In / Out
router.post('/punch-in', punchLimiter, punchIn);
router.post('/punch-out', punchLimiter, punchOut);

// Personal attendance
router.get('/today', getToday);
router.get('/my', getMyAttendance);

// Admin / HR — any employee's records
router.get('/team', rbac(['admin', 'hr']), getTeamAttendance);
router.get('/user/:userId', rbac(['admin', 'hr']), getUserAttendance);

// Regularization
router.post('/regularize', applyRegularization);
router.get('/regularize', rbac(['admin', 'hr']), getRegularizations);
router.patch('/regularize/:id/approve', rbac(['admin', 'hr']), approveRegularization);
router.patch('/regularize/:id/reject', rbac(['admin', 'hr']), rejectRegularization);

// Settings (admin only)
router.get('/settings', rbac(['admin']), getAttendanceSettings);
router.patch('/settings', rbac(['admin']), updateAttendanceSettings);

// Reports
router.get('/report/monthly', monthlyReport);
router.get('/report/export', rbac(['admin', 'hr']), exportReport);
router.get('/report/summary', rbac(['admin']), yearlySummary);

// Admin / HR Management Dashboard APIs
router.get('/admin/today-snapshot', rbac(['admin', 'hr']), getTodaySnapshot);
router.get('/admin/pending-actions', rbac(['admin', 'hr']), getPendingActions);

module.exports = router;
