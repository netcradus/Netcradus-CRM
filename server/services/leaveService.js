const LeaveBalance = require('../models/LeaveBalance');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveType = require('../models/LeaveType');
const User = require('../models/User');
const { getSettings } = require('../config/attendanceSettings');
const { getHolidaysForYear } = require('./holidayService');
const { getWorkingDaysBetween } = require('../utils/dateUtils');
const { addDays, startOfDay } = require('date-fns');

const DEFAULT_LEAVE_TYPES = [
  {
    name: 'Casual Leave',
    code: 'CL',
    defaultDaysPerYear: 12,
    noticePeriodDays: 0,
    allowHalfDay: true,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Sick Leave',
    code: 'SL',
    defaultDaysPerYear: 12,
    noticePeriodDays: 0,
    allowHalfDay: true,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Earned Leave',
    code: 'EL',
    defaultDaysPerYear: 15,
    noticePeriodDays: 3,
    allowHalfDay: false,
    isCarryForward: true,
    maxCarryForwardDays: 30,
    isActive: true,
  },
  {
    name: 'Unpaid Leave',
    code: 'UL',
    defaultDaysPerYear: 365,
    noticePeriodDays: 0,
    allowHalfDay: false,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Compensatory Off',
    code: 'CO',
    defaultDaysPerYear: 0,
    noticePeriodDays: 0,
    allowHalfDay: true,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Maternity Leave',
    code: 'ML',
    defaultDaysPerYear: 182,
    noticePeriodDays: 7,
    allowHalfDay: false,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Paternity Leave',
    code: 'PL',
    defaultDaysPerYear: 15,
    noticePeriodDays: 3,
    allowHalfDay: false,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
];

async function ensureDefaultLeaveTypes() {
  const existingCount = await LeaveType.countDocuments({ isActive: true });
  if (existingCount > 0) {
    return LeaveType.find({ isActive: true }).sort({ name: 1 }).lean();
  }

  await Promise.all(
    DEFAULT_LEAVE_TYPES.map((leaveType) =>
      LeaveType.findOneAndUpdate(
        { code: leaveType.code },
        { $setOnInsert: leaveType },
        { upsert: true, new: true }
      )
    )
  );

  return LeaveType.find({ isActive: true }).sort({ name: 1 }).lean();
}

async function ensureUserLeaveBalances(userId, year) {
  const leaveTypes = await ensureDefaultLeaveTypes();

  await Promise.all(
    leaveTypes.map((leaveType) => {
      const allocated = leaveType.code === 'EL' ? 0 : leaveType.defaultDaysPerYear;
      return LeaveBalance.findOneAndUpdate(
        { userId, year, leaveTypeId: leaveType._id },
        {
          $setOnInsert: {
            userId,
            year,
            leaveTypeId: leaveType._id,
            allocated,
            used: 0,
            pending: 0,
            remaining: allocated,
            carried: 0,
          },
        },
        { upsert: true }
      );
    })
  );

  return leaveTypes;
}

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
  await ensureDefaultLeaveTypes();
  const leaveType = await LeaveType.findById(leaveTypeId);
  const user = await User.findById(userId).select('role');
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
  const skipBalanceCheck = ['admin', 'super_user'].includes(user?.role);
  if (leaveType.code !== 'UL' && !skipBalanceCheck) {
    await ensureUserLeaveBalances(userId, year);
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
  await ensureUserLeaveBalances(userId, year);
  const balances = await LeaveBalance.find({ userId, year }).populate('leaveTypeId').lean();
  if (balances.length) {
    return balances;
  }

  const leaveTypes = await ensureDefaultLeaveTypes();
  return leaveTypes.map((leaveType) => ({
    userId,
    year,
    leaveTypeId: leaveType,
    allocated: 0,
    used: 0,
    pending: 0,
    remaining: 0,
  }));
}

module.exports = {
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  countLeaveDays,
  checkOverlap,
  getLeaveBalance,
  ensureDefaultLeaveTypes,
  ensureUserLeaveBalances,
};
