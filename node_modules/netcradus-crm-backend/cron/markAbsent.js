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

    const users = await User.find({ isActive: { $ne: false }, role: { $ne: 'super_user' } }).select('_id').lean();
    const userIds = users.map((user) => user._id);
    if (!userIds.length) return 0;

    const [existingRecords, approvedLeaves] = await Promise.all([
      AttendanceRecord.find({ userId: { $in: userIds }, shiftDate }).select('userId').lean(),
      LeaveApplication.find({
        userId: { $in: userIds },
        status: 'approved',
        from: { $lte: shiftDate },
        to: { $gte: shiftDate },
      }).select('userId').lean(),
    ]);

    const existingUserIds = new Set(existingRecords.map((record) => String(record.userId)));
    const leaveUserIds = new Set(approvedLeaves.map((leave) => String(leave.userId)));
    const recordsToCreate = userIds
      .filter((userId) => !existingUserIds.has(String(userId)))
      .map((userId) => ({
        userId,
        shiftDate,
        status: leaveUserIds.has(String(userId)) ? 'on_leave' : 'absent',
      }));

    if (recordsToCreate.length) {
      await AttendanceRecord.insertMany(recordsToCreate, { ordered: false });
    }

    const count = recordsToCreate.length;

    if (count > 0) {
      console.log(`[CRON markAbsent] Processed ${count} user(s) for ${shiftDate.toISOString().split('T')[0]}.`);
    }
    return count;
  } catch (err) {
    console.error('[CRON markAbsent] Error:', err.message);
  }
}

module.exports = markAbsent;
