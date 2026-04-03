const LeaveBalance = require('../models/LeaveBalance');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveType = require('../models/LeaveType');
const { getSettings } = require('../config/attendanceSettings');
const { getHolidaysForYear } = require('./holidayService');
const { getWorkingDaysBetween } = require('../utils/dateUtils');
const { addDays, startOfDay } = require('date-fns');

/**
 * Count working days for a leave application, excluding weekends and holidays
 */
async function countLeaveDays(from, to, isHalfDay) {
  if (isHalfDay) return 0.5;
  const settings = await getSettings();
  const year = new Date(from).getFullYear();
  const holidays = await getHolidaysForYear(year);
  return getWorkingDaysBetween(new Date(from), new Date(to), holidays, settings.weekends, settings.timezone);
}

/**
 * Check if a leave application overlaps with existing approved/pending leaves
 */
async function checkOverlap(userId, from, to, excludeId = null) {
  const query = {
    userId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { from: { $lte: new Date(to) }, to: { $gte: new Date(from) } }
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await LeaveApplication.findOne(query);
  return !!existing;
}

/**
 * Apply for leave — validates balance, notice period, overlap
 */
async function applyLeave(userId, { leaveTypeId, from, to, isHalfDay, halfDaySession, reason, documents }) {
  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType || !leaveType.isActive) throw new Error('Invalid or inactive leave type.');

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (toDate < fromDate) throw new Error('End date cannot be before start date.');

  // Notice period check
  const today = startOfDay(new Date());
  const noticeDays = leaveType.noticePeriodDays || 0;
  const minFromDate = addDays(today, noticeDays);
  if (noticeDays > 0 && fromDate < minFromDate) {
    throw new Error(`${leaveType.name} requires ${noticeDays} day(s) advance notice.`);
  }

  // Overlap check
  const hasOverlap = await checkOverlap(userId, from, to);
  if (hasOverlap) throw new Error('Leave dates overlap with an existing application.');

  const totalDays = await countLeaveDays(from, to, isHalfDay);
  if (totalDays <= 0) throw new Error('No working days in the selected date range.');

  // Balance check (for non-unlimited types like UL)
  const year = fromDate.getFullYear();
  if (leaveType.code !== 'UL') {
    const balance = await LeaveBalance.findOne({ userId, year, leaveTypeId });
    if (!balance || balance.remaining < totalDays) {
      throw new Error(`Insufficient leave balance. Available: ${balance ? balance.remaining : 0} day(s).`);
    }
    // Pre-deduct as "pending"
    await LeaveBalance.findByIdAndUpdate(balance._id, {
      $inc: { pending: totalDays, remaining: -totalDays }
    });
  }

  const application = await LeaveApplication.create({
    userId,
    leaveTypeId,
    from: fromDate,
    to: toDate,
    totalDays,
    isHalfDay: !!isHalfDay,
    halfDaySession,
    reason,
    documents,
    appliedAt: new Date(),
    status: 'pending',
  });

  return application;
}

/**
 * Approve a leave application
 */
async function approveLeave(applicationId, reviewedBy, reviewNote) {
  const app = await LeaveApplication.findById(applicationId).populate('leaveTypeId');
  if (!app) throw new Error('Leave application not found.');
  if (app.status !== 'pending') throw new Error(`Cannot approve a leave that is already ${app.status}.`);

  // Move pending → used in balance
  const year = new Date(app.from).getFullYear();
  if (app.leaveTypeId.code !== 'UL') {
    await LeaveBalance.findOneAndUpdate(
      { userId: app.userId, year, leaveTypeId: app.leaveTypeId._id },
      { $inc: { pending: -app.totalDays, used: app.totalDays } }
    );
  }

  app.status = 'approved';
  app.reviewedBy = reviewedBy;
  app.reviewedAt = new Date();
  app.reviewNote = reviewNote;
  await app.save();
  return app;
}

/**
 * Reject a leave application — releases pending balance
 */
async function rejectLeave(applicationId, reviewedBy, reviewNote) {
  const app = await LeaveApplication.findById(applicationId).populate('leaveTypeId');
  if (!app) throw new Error('Leave application not found.');
  if (app.status !== 'pending') throw new Error(`Cannot reject a leave that is already ${app.status}.`);

  if (app.leaveTypeId.code !== 'UL') {
    const year = new Date(app.from).getFullYear();
    await LeaveBalance.findOneAndUpdate(
      { userId: app.userId, year, leaveTypeId: app.leaveTypeId._id },
      { $inc: { pending: -app.totalDays, remaining: app.totalDays } }
    );
  }

  app.status = 'rejected';
  app.reviewedBy = reviewedBy;
  app.reviewedAt = new Date();
  app.reviewNote = reviewNote;
  await app.save();
  return app;
}

/**
 * Cancel a leave application
 * - If pending: employee can cancel directly
 * - If approved: mark cancelRequested, admin must approve
 */
async function cancelLeave(applicationId, userId) {
  const app = await LeaveApplication.findById(applicationId).populate('leaveTypeId');
  if (!app) throw new Error('Leave application not found.');
  if (String(app.userId) !== String(userId)) throw new Error('You can only cancel your own leave.');

  if (app.status === 'pending') {
    // Release pending balance
    if (app.leaveTypeId.code !== 'UL') {
      const year = new Date(app.from).getFullYear();
      await LeaveBalance.findOneAndUpdate(
        { userId: app.userId, year, leaveTypeId: app.leaveTypeId._id },
        { $inc: { pending: -app.totalDays, remaining: app.totalDays } }
      );
    }
    app.status = 'cancelled';
    app.cancelRequestedAt = new Date();
    await app.save();
  } else if (app.status === 'approved') {
    app.cancelRequestedAt = new Date();
    await app.save();
    return { ...app.toObject(), message: 'Cancellation request submitted. Awaiting admin approval.' };
  } else {
    throw new Error(`Cannot cancel a leave with status: ${app.status}.`);
  }
  return app;
}

/**
 * Get leave balance breakdown for a user for a given year
 */
async function getLeaveBalance(userId, year) {
  const balances = await LeaveBalance.find({ userId, year }).populate('leaveTypeId').lean();
  return balances;
}

module.exports = { applyLeave, approveLeave, rejectLeave, cancelLeave, countLeaveDays, checkOverlap, getLeaveBalance };
