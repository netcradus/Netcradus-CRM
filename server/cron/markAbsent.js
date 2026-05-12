const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveApplication = require('../models/LeaveApplication');
const User = require('../models/User');
const { getSettings } = require('../config/attendanceSettings');
const { getHolidaysForYear } = require('../services/holidayService');
const { getTodayShiftDate, isWeekend, isHoliday } = require('../utils/dateUtils');

/**
 * Mark absent: for every active user, if no attendance record exists
 * for today AND today is not a weekend/holiday AND no approved leave
 * exists → insert record with status: 'absent'
 */
async function markAbsent() {
  try {
    const settings = await getSettings();
    const shiftDate = getTodayShiftDate(settings.timezone);
    const year = shiftDate.getUTCFullYear();
    const holidays = await getHolidaysForYear(year);

    // Skip if today is weekend or holiday
    if (isWeekend(shiftDate, settings.weekends, settings.timezone)) {
      return;
    }
    if (isHoliday(shiftDate, holidays)) {
      return;
    }

    const users = await User.find({ isActive: { $ne: false }, role: { $nin: ['admin', 'hr', 'super_user'] } }).select('_id').lean();
    let count = 0;

    for (const user of users) {
      // Check if record already exists
      const existing = await AttendanceRecord.findOne({ userId: user._id, shiftDate });
      if (existing) continue;

      // Check if user has approved leave for today
      const leave = await LeaveApplication.findOne({
        userId: user._id,
        status: 'approved',
        from: { $lte: shiftDate },
        to: { $gte: shiftDate },
      });

      if (leave) {
        // Create on_leave record
        await AttendanceRecord.create({
          userId: user._id,
          shiftDate,
          status: 'on_leave',
        });
      } else {
        // Mark absent
        await AttendanceRecord.create({
          userId: user._id,
          shiftDate,
          status: 'absent',
        });
      }
      count++;
    }

    if (count > 0) {
      console.log(`[CRON markAbsent] Processed ${count} user(s) for ${shiftDate.toISOString().split('T')[0]}.`);
    }
    return count;
  } catch (err) {
    console.error('[CRON markAbsent] Error:', err.message);
  }
}

module.exports = markAbsent;
