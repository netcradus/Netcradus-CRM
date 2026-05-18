const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const {
  applyLeave,
  getMyLeaves,
  getLeaveTypes,
  getBalance,
  getAllApplications,
  approveLeave,
  rejectLeave,
  cancelLeave,
} = require('../controllers/leaveController');

router.get('/types', getLeaveTypes);
router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.get('/balance/:userId', getBalance);
router.get('/applications', rbac(['super_user', 'admin', 'hr']), getAllApplications);
router.patch('/:id/approve', rbac(['super_user', 'admin', 'hr']), approveLeave);
router.patch('/:id/reject', rbac(['super_user', 'admin', 'hr']), rejectLeave);
router.patch('/:id/cancel', cancelLeave);

module.exports = router;
