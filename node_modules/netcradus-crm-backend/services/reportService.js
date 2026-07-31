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
  const allDays = await getMonthRecords(userId, numericMonth, numericYear);

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
    let dayData = { ...day };
    if (!day._synthetic) {
      dayData.remark = day.notes || '';
    } else {
      dayData.remark = '';
    }

    if (day.status === 'absent' && leaveDateSet.size > 0) {
      const dateKey = formatShiftDate(new Date(day.shiftDate), settings.timezone);
      if (leaveDateSet.has(dateKey)) {
        const matchedLeave = approvedLeaves.find(l => {
          let cur = new Date(l.from);
          const leaveEnd = new Date(l.to);
          while (cur <= leaveEnd) {
            if (formatShiftDate(cur, settings.timezone) === dateKey) return true;
            cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
          }
          return false;
        });

        dayData.status = 'on_leave';
        if (matchedLeave) {
          dayData.leaveType = matchedLeave.leaveType || '';
          dayData.remark = matchedLeave.reason || '';
        }
      }
    }
    return dayData;
  });

  const user = await User.findById(userId).select('name employeeId department designation email').lean();

  // Compute summary statistics from the complete records array.
  const totalWorkingDays  = records.filter(r => r.status !== 'weekend' && r.status !== 'holiday').length;
  const present           = records.filter(r => r.status === 'present' || r.status === 'half_day' || r.status === 'overtime').length;
  const absent            = records.filter(r => r.status === 'absent').length;
  const halfDay           = records.filter(r => r.status === 'half_day').length;
  const onLeave           = records.filter(r => r.status === 'on_leave').length;
  const lateCount         = records.filter(r => r.isLate === true).length;
  const totalHoursWorked  = +(records.reduce((sum, r) => sum + (r.workingHours || 0), 0)).toFixed(2);
  const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);
  const attendancePercentage = totalWorkingDays > 0 ? Math.round((present / totalWorkingDays) * 100) : 0;

  return {
    user: {
      name: user?.name || user?.email || '—',
      employeeId: user?.employeeId || '—',
      department: user?.department || '—',
      designation: user?.designation || '—'
    },
    totalWorkingDays,
    present,
    absent,
    halfDay,
    onLeave,
    lateCount,
    totalHoursWorked,
    totalOvertimeMinutes,
    attendancePercentage,
    records,
  };
}

function csvEscape(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export a single user's detailed monthly report as CSV.
 */
async function exportMonthlyCsv(userId, month, year) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("User not found");

  const report = await getMonthlyReport(userId, month, year);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[month - 1] || "";

  const lines = [];
  lines.push(`Employee Name,${csvEscape(user.name || user.email)}`);
  lines.push(`Employee ID,${csvEscape(user.employeeId || '—')}`);
  lines.push(`Report Period,${csvEscape(`${monthName} ${year}`)}`);
  lines.push(`Working Days,${report.totalWorkingDays}`);
  lines.push(`Present Days,${report.present}`);
  lines.push(`Absent Days,${report.absent}`);
  lines.push(`Late Arrivals,${report.lateCount}`);
  lines.push(`Total Working Hours,${report.totalHoursWorked}`);
  lines.push(''); // blank line

  // Table header
  const headers = ['Date', 'Day', 'Status', 'Punch In', 'Punch Out', 'Working Hours', 'Break', 'Late By', 'Overtime', 'Leave Type', 'Remarks'];
  lines.push(headers.join(','));

  for (const r of report.records) {
    const cleanStr = r.shiftDate instanceof Date ? r.shiftDate.toISOString().split('T')[0] : String(r.shiftDate).split('T')[0];
    const [y, m, d] = cleanStr.split('-').map(Number);
    const dateNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dName = dateNames[m - 1] || "";
    const dateDisplay = `${String(d).padStart(2, '0')} ${dName} ${y}`;
    const weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

    const formatTimeHelper = (isoString) => {
      if (!isoString) return "—";
      const date = new Date(isoString);
      let hours = date.getHours();
      const mins = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
    };

    const getLateByStr = (isLate, mins = 0) => {
      if (!isLate || mins <= 0) return "—";
      if (mins < 60) return `${mins}m`;
      const h = Math.floor(mins / 60);
      const rm = mins % 60;
      if (rm === 0) return `${h}h`;
      return `${h}h ${rm}m`;
    };

    const getDurationStr = (mins) => {
      if (!mins || mins <= 0) return "—";
      const h = Math.floor(mins / 60);
      const rm = Math.floor(mins % 60);
      if (!h) return `${rm}m`;
      if (!rm) return `${h}h`;
      return `${h}h ${rm}m`;
    };

    const statusLabel = r.status ? r.status.replace('_', ' ') : '—';
    const capitalizedStatus = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);

    const punchInStr = formatTimeHelper(r.punchIn);
    const punchOutStr = formatTimeHelper(r.punchOut);
    const workingHoursStr = r.workingHours ? `${r.workingHours}h` : '—';
    const breakStr = r.totalBreakDurationMinutes !== undefined && r.totalBreakDurationMinutes !== null ? `${r.totalBreakDurationMinutes}m` : '0m';
    const lateByStr = getLateByStr(r.isLate, r.lateByMinutes);
    const overtimeStr = r.overtimeMinutes > 0 ? getDurationStr(r.overtimeMinutes) : '—';
    const leaveTypeStr = r.leaveType || '—';
    const remarksStr = r.remark || '—';

    const row = [
      dateDisplay,
      weekday,
      capitalizedStatus,
      punchInStr,
      punchOutStr,
      workingHoursStr,
      breakStr,
      lateByStr,
      overtimeStr,
      leaveTypeStr,
      remarksStr
    ];

    lines.push(row.map(csvEscape).join(','));
  }

  return lines.join('\n');
}

/**
 * Yearly summary per employee (all months)
 */
async function getYearlySummary(year) {
  const summaries = await AttendanceSummary.find({ year }).populate('userId', 'name email').lean();
  return summaries;
}

module.exports = { getMonthlyReport, exportMonthlyCsv, getYearlySummary };
