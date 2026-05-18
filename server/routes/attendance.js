const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const rateLimit = require('express-rate-limit');
const {
  punchIn,
  punchOut,
  breakStart,
  breakEnd,
  getToday,
  getCurrentStatus,
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

// Punch In / Out
router.post('/punch-in', punchLimiter, punchIn);
router.post('/punch-out', punchLimiter, punchOut);
router.post('/break-start', punchLimiter, breakStart);
router.post('/break-end', punchLimiter, breakEnd);

// Personal attendance
router.get('/today', getToday);
router.get('/current-status', getCurrentStatus);
router.get('/my', getMyAttendance);

// Admin / HR — any employee's records
router.get('/team', rbac(['super_user', 'admin', 'hr']), getTeamAttendance);
router.get('/user/:userId', rbac(['super_user', 'admin', 'hr']), getUserAttendance);

// Regularization
router.post('/regularize', applyRegularization);
router.get('/regularize', rbac(['super_user', 'hr']), getRegularizations);
router.patch('/regularize/:id/approve', rbac(['super_user', 'hr']), approveRegularization);
router.patch('/regularize/:id/reject', rbac(['super_user', 'hr']), rejectRegularization);

// Settings (super user only)
router.get('/settings', rbac(['super_user']), getAttendanceSettings);
router.patch('/settings', rbac(['super_user']), updateAttendanceSettings);

// Reports
router.get('/report/monthly', monthlyReport);
router.get('/report/export', rbac(['super_user', 'hr']), exportReport);
router.get('/report/summary', rbac(['super_user']), yearlySummary);

// Admin / HR Management Dashboard APIs
router.get('/admin/today-snapshot', rbac(['super_user', 'admin', 'hr']), getTodaySnapshot);
router.get('/admin/pending-actions', rbac(['super_user', 'admin', 'hr']), getPendingActions);

module.exports = router;
