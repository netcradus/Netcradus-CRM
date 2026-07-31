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

    const { getMonthlyReport } = require('../services/reportService');
    const users = await User.find({ isActive: { $ne: false }, role: { $ne: 'super_user' } }).select('_id').lean();
    let count = 0;

    for (const user of users) {
      const report = await getMonthlyReport(user._id, month, year);

      const summary = {
        userId: user._id,
        month,
        year,
        totalWorkingDays: report.totalWorkingDays,
        present: report.present,
        absent: report.absent,
        halfDay: report.halfDay,
        onLeave: report.onLeave,
        holidays: report.records.filter(r => r.status === 'holiday').length,
        weekends: report.records.filter(r => r.status === 'weekend').length,
        totalHoursWorked: report.totalHoursWorked,
        totalOvertime: +(report.records.reduce((s, r) => s + ((r.overtimeMinutes || 0) / 60), 0)).toFixed(2),
        lateCount: report.lateCount,
        earlyDepartureCount: report.records.filter(r => r.isEarlyDeparture).length,
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
