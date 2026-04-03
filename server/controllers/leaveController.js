const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveType = require('../models/LeaveType');
const AuditLog = require('../models/AuditLog');
const { applyLeave, approveLeave, rejectLeave, cancelLeave, getLeaveBalance } = require('../services/leaveService');

// POST /api/leave/apply
exports.applyLeave = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admins are exempt from leave applications.' });
    }
    const { leaveTypeId, from, to, isHalfDay, halfDaySession, reason, documents } = req.body;
    if (!leaveTypeId || !from || !to || !reason) {
      return res.status(400).json({ success: false, message: 'leaveTypeId, from, to, and reason are required.' });
    }
    const application = await applyLeave(req.user._id, { leaveTypeId, from, to, isHalfDay, halfDaySession, reason, documents });
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/leave/my?year=YYYY
exports.getMyLeaves = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const [applications, balances] = await Promise.all([
      LeaveApplication.find({ userId: req.user._id }).populate('leaveTypeId', 'name code').sort({ appliedAt: -1 }).lean(),
      getLeaveBalance(req.user._id, year),
    ]);
    res.status(200).json({ success: true, data: { applications, balances } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/leave/balance/:userId?year=YYYY
exports.getBalance = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Security: non-admin/hr can only see own balance
    if (!['admin', 'hr'].includes(req.user.role) && String(req.user._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const balances = await getLeaveBalance(userId, year);
    res.status(200).json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/leave/applications?status=pending&page=1&limit=20  (admin/hr)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      LeaveApplication.find(query)
        .populate('userId', 'name email role')
        .populate('leaveTypeId', 'name code')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LeaveApplication.countDocuments(query),
    ]);
    res.status(200).json({ success: true, data: applications, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/leave/:id/approve
exports.approveLeave = async (req, res) => {
  try {
    const application = await approveLeave(req.params.id, req.user._id, req.body.reviewNote);
    await AuditLog.create({
      userId: req.user._id,
      action: 'LEAVE_APPROVED',
      targetId: application._id,
      targetModel: 'LeaveApplication',
      details: { forUser: application.userId, days: application.totalDays },
    });
    res.status(200).json({ success: true, data: application });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/leave/:id/reject
exports.rejectLeave = async (req, res) => {
  try {
    const application = await rejectLeave(req.params.id, req.user._id, req.body.reviewNote);
    await AuditLog.create({
      userId: req.user._id,
      action: 'LEAVE_REJECTED',
      targetId: application._id,
      targetModel: 'LeaveApplication',
      details: { forUser: application.userId },
    });
    res.status(200).json({ success: true, data: application });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/leave/:id/cancel
exports.cancelLeave = async (req, res) => {
  try {
    const result = await cancelLeave(req.params.id, req.user._id);
    await AuditLog.create({
      userId: req.user._id,
      action: 'LEAVE_CANCELLED',
      targetId: req.params.id,
      targetModel: 'LeaveApplication',
      details: { cancelledBy: req.user.role },
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
