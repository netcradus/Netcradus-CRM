const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSummary = require('../models/AttendanceSummary');
const User = require('../models/User');
const { getSettings } = require('../config/attendanceSettings');
const { getHolidaysForYear } = require('./holidayService');
const { formatShiftDate, isWeekend, isHoliday } = require('../utils/dateUtils');
const { Parser: Json2csvParser } = require('json2csv');

/**
 * Generate full month breakdown for a single user
 */
async function getMonthlyReport(userId, month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const records = await AttendanceRecord.find({
    userId,
    shiftDate: { $gte: start, $lte: end }
  }).populate('userId', 'name email').lean();
  return records;
}

/**
 * Export all employees' attendance for a given month as CSV (matrix format)
 * Rows = employees, Columns = days 1..N, Values = P/A/L/H/WO/HD
 */
async function exportMonthlyCsv(month, year) {
  const settings = await getSettings();
  const holidays = await getHolidaysForYear(year);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  const STATUS_INITIALS = {
    present: 'P',
    absent: 'A',
    on_leave: 'L',
    holiday: 'H',
    weekend: 'WO',
    half_day: 'HD',
  };

  // Build day columns
  const days = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(cur.getUTCDate());
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }

  const users = await User.find({ isActive: { $ne: false }, role: { $ne: 'super_user' } }).lean();

  const records = await AttendanceRecord.find({
    shiftDate: { $gte: start, $lte: end }
  }).lean();

  // Index by userId+day
  const index = {};
  records.forEach(r => {
    const day = new Date(r.shiftDate).getUTCDate();
    const key = `${r.userId}_${day}`;
    index[key] = r.status;
  });

  const rows = users.map(u => {
    const row = { Name: u.name || u.email };
    days.forEach(day => {
      const date = new Date(Date.UTC(year, month - 1, day));
      let status = index[`${u._id}_${day}`];
      if (!status) {
        if (isWeekend(date, settings.weekends, settings.timezone)) status = 'weekend';
        else if (isHoliday(date, holidays)) status = 'holiday';
        else status = 'absent';
      }
      row[`Day ${day}`] = STATUS_INITIALS[status] || status;
    });
    return row;
  });

  const fields = ['Name', ...days.map(d => `Day ${d}`)];
  const parser = new Json2csvParser({ fields });
  return parser.parse(rows);
}

/**
 * Yearly summary per employee (all months)
 */
async function getYearlySummary(year) {
  const summaries = await AttendanceSummary.find({ year }).populate('userId', 'name email').lean();
  return summaries;
}

module.exports = { getMonthlyReport, exportMonthlyCsv, getYearlySummary };
