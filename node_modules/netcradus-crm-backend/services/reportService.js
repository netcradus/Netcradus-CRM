const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSummary = require('../models/AttendanceSummary');
const LeaveApplication = require('../models/LeaveApplication');
const User = require('../models/User');
const { getSettings } = require('../config/attendanceSettings');
const { getHolidaysForYear } = require('./holidayService');
const { formatShiftDate, isWeekend, isHoliday } = require('../utils/dateUtils');
const { getMonthRecords } = require('./attendanceService');
const { Parser: Json2csvParser } = require('json2csv');

/**
 * Generate full month report summary for a single user.
 * Returns a summary object (not a raw array) with aggregated stats and a
 * complete day-by-day records array including synthetic absent/weekend/holiday
 * days for dates with no stored AttendanceRecord.
 */
async function getMonthlyReport(userId, month, year) {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  // Re-use the authoritative day-generation logic from attendanceService.
  // This produces one entry per calendar day (real records + synthetic absent/
  // weekend/holiday stubs) using the configured timezone and holiday list.
  const allDays = await getMonthRecords(userId, numericMonth, numericYear);

  // ------------------------------------------------------------------
  // Leave integration: overlay on_leave for approved leave days that
  // currently show as absent in the generated records.
  // ------------------------------------------------------------------
  const settings = await getSettings();
  const startDate = new Date(Date.UTC(numericYear, numericMonth - 1, 1));
  const endDate   = new Date(Date.UTC(numericYear, numericMonth, 0));   // last day of month

  const approvedLeaves = await LeaveApplication.find({
    userId,
    status: 'approved',
    from: { $lte: endDate },
    to:   { $gte: startDate },
  }).lean();

  // Build a Set of leave date strings (YYYY-MM-DD in company timezone) for O(1) lookup.
  const leaveDateSet = new Set();
  for (const leave of approvedLeaves) {
    let cur        = new Date(leave.from);
    const leaveEnd = new Date(leave.to);
    while (cur <= leaveEnd) {
      leaveDateSet.add(formatShiftDate(cur, settings.timezone));
      cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Apply leave overlay: absent → on_leave where an approved leave exists.
  const records = allDays.map(day => {
    if (day.status === 'absent' && leaveDateSet.size > 0) {
      const dateKey = formatShiftDate(new Date(day.shiftDate), settings.timezone);
      if (leaveDateSet.has(dateKey)) {
        return { ...day, status: 'on_leave' };
      }
    }
    return day;
  });

  // ------------------------------------------------------------------
  // Compute summary statistics from the complete records array.
  // Weekends and holidays are excluded from totalWorkingDays.
  // ------------------------------------------------------------------
  const totalWorkingDays  = records.filter(r => r.status !== 'weekend' && r.status !== 'holiday').length;
  const present           = records.filter(r => r.status === 'present').length;
  const absent            = records.filter(r => r.status === 'absent').length;
  const halfDay           = records.filter(r => r.status === 'half_day').length;
  const onLeave           = records.filter(r => r.status === 'on_leave').length;
  const lateCount         = records.filter(r => r.isLate === true).length;
  const totalHoursWorked  = +(records.reduce((sum, r) => sum + (r.workingHours || 0), 0)).toFixed(2);

  return {
    totalWorkingDays,
    present,
    absent,
    halfDay,
    onLeave,
    lateCount,
    totalHoursWorked,
    records,
  };
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
