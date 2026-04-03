const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');

/**
 * Leave accrual: On 1st of each month, add (15/12) = 1.25 days 
 * to all active employees' EL balance for the current year.
 * 
 * Also handles yearly reset + carry forward on January 1st.
 */
async function leaveAccrual() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Monthly EL accrual
    const elType = await LeaveType.findOne({ code: 'EL', isActive: true });
    if (elType) {
      const monthlyAccrual = +(elType.defaultDaysPerYear / 12).toFixed(2);
      const users = await User.find({ isActive: { $ne: false }, role: { $ne: 'admin' } }).select('_id').lean();

      for (const user of users) {
        await LeaveBalance.findOneAndUpdate(
          { userId: user._id, year: currentYear, leaveTypeId: elType._id },
          { $inc: { allocated: monthlyAccrual, remaining: monthlyAccrual } },
          { upsert: true }
        );
      }
      console.log(`[CRON leaveAccrual] Accrued ${monthlyAccrual} EL day(s) for ${users.length} user(s).`);
    }

    // Yearly reset + carry forward on January 1st
    if (currentMonth === 1) {
      await yearlyReset(currentYear);
    }
  } catch (err) {
    console.error('[CRON leaveAccrual] Error:', err.message);
  }
}

/**
 * Create new year balances with defaults; carry forward EL from previous year
 */
async function yearlyReset(newYear) {
  try {
    const prevYear = newYear - 1;
    const leaveTypes = await LeaveType.find({ isActive: true }).lean();
    const users = await User.find({ isActive: { $ne: false }, role: { $ne: 'admin' } }).select('_id').lean();

    for (const user of users) {
      for (const lt of leaveTypes) {
        // Check if balance already exists for new year (idempotent)
        const existing = await LeaveBalance.findOne({ userId: user._id, year: newYear, leaveTypeId: lt._id });
        if (existing) continue;

        let carried = 0;
        if (lt.isCarryForward) {
          const prevBalance = await LeaveBalance.findOne({ userId: user._id, year: prevYear, leaveTypeId: lt._id });
          if (prevBalance && prevBalance.remaining > 0) {
            carried = Math.min(prevBalance.remaining, lt.maxCarryForwardDays || 0);
          }
        }

        // For EL, start with 0 allocated (accrual will add monthly)
        const allocated = lt.code === 'EL' ? carried : lt.defaultDaysPerYear + carried;

        await LeaveBalance.create({
          userId: user._id,
          year: newYear,
          leaveTypeId: lt._id,
          allocated,
          used: 0,
          pending: 0,
          remaining: allocated,
          carried,
        });
      }
    }
    console.log(`[CRON yearlyReset] Created ${newYear} leave balances for ${users.length} user(s).`);
  } catch (err) {
    console.error('[CRON yearlyReset] Error:', err.message);
  }
}

module.exports = leaveAccrual;
