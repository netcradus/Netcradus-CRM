const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const rbac = require('../middleware/rbac');
const {
  applyLeave,
  getMyLeaves,
  getBalance,
  getAllApplications,
  approveLeave,
  rejectLeave,
  cancelLeave,
} = require('../controllers/leaveController');

router.use(authMiddleware);

router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.get('/balance/:userId', getBalance);
router.get('/applications', rbac(['admin', 'hr']), getAllApplications);
router.patch('/:id/approve', rbac(['admin', 'hr']), approveLeave);
router.patch('/:id/reject', rbac(['admin', 'hr']), rejectLeave);
router.patch('/:id/cancel', cancelLeave);

module.exports = router;
