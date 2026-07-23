const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSummary = require('../models/AttendanceSummary');
const User = require('../models/User');

/**
 * Monthly summary generation: aggregate last month's records per user
 * and upsert into AttendanceSummary
 */
async function monthlySummary() {
  try {
    const now = new Date();
    // Previous month
    let month = now.getMonth(); // 0-indexed, so current month minus 1
    let year = now.getFullYear();
    if (month === 0) { month = 12; year--; } // January → December of prev year

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    const users = await User.find({ isActive: { $ne: false }, role: { $ne: 'super_user' } }).select('_id').lean();
    let count = 0;

    for (const user of users) {
      const records = await AttendanceRecord.find({
        userId: user._id,
        shiftDate: { $gte: start, $lte: end },
      }).lean();

      const summary = {
        userId: user._id,
        month,
        year,
        totalWorkingDays: records.length,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        halfDay: records.filter(r => r.status === 'half_day').length,
        onLeave: records.filter(r => r.status === 'on_leave').length,
        holidays: records.filter(r => r.status === 'holiday').length,
        weekends: records.filter(r => r.status === 'weekend').length,
        totalHoursWorked: +(records.reduce((s, r) => s + (r.workingHours || 0), 0)).toFixed(2),
        totalOvertime: +(records.reduce((s, r) => s + (r.overtimeHours || 0), 0)).toFixed(2),
        lateCount: records.filter(r => r.isLate).length,
        earlyDepartureCount: records.filter(r => r.isEarlyDeparture).length,
        generatedAt: new Date(),
      };

      await AttendanceSummary.findOneAndUpdate(
        { userId: user._id, month, year },
        { $set: summary },
        { upsert: true }
      );
      count++;
    }

    console.log(`[CRON monthlySummary] Generated summaries for ${count} user(s), ${month}/${year}.`);
    return count;
  } catch (err) {
    console.error('[CRON monthlySummary] Error:', err.message);
  }
}

module.exports = monthlySummary;
