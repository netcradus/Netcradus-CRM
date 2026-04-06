const { differenceInMinutes, differenceInSeconds } = require('date-fns');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceBreak = require('../models/AttendanceBreak');
const { getSettings } = require('../config/attendanceSettings');
const { getHolidaysForYear } = require('./holidayService');
const {
  getTodayShiftDate,
  buildOfficeDateTime,
  calcWorkingHours,
  isWeekend,
  isHoliday,
  formatShiftDate,
} = require('../utils/dateUtils');

/**
 * Pure function — calculate derived attendance fields from punchIn/punchOut
 */
function calculateStatus(workingHours, settings) {
  if (workingHours >= settings.standardHours) return 'present';
  if (workingHours >= settings.minHoursForPresent) return 'half_day';
  return 'half_day'; // punched in but below min hours = half_day
}

function buildBreakSummary(record, breaks = [], now = new Date()) {
  const completedBreakMinutes = record?.totalBreakDurationMinutes
    ?? breaks.reduce((sum, item) => sum + (item.breakDurationMinutes || 0), 0);

  const ongoingBreakMinutes = record?.isOnBreak && record?.currentBreakStart
    ? Math.max(0, differenceInMinutes(now, new Date(record.currentBreakStart)))
    : 0;

  return {
    completedBreakMinutes,
    ongoingBreakMinutes,
    totalBreakMinutesSoFar: completedBreakMinutes + ongoingBreakMinutes,
  };
}

function calculateFields(record, punchOut, settings, options = {}) {
  const punchIn = new Date(record.punchIn);
  const punchOutDate = new Date(punchOut);
  const breakMinutes = options.totalBreakDurationMinutes ?? record.totalBreakDurationMinutes ?? 0;
  const totalMinutes = Math.max(0, differenceInMinutes(punchOutDate, punchIn));
  const netWorkDurationMinutes = Math.max(0, totalMinutes - breakMinutes);
  const overtimeMinutes = Math.max(0, netWorkDurationMinutes - (settings.standardHours * 60));
  const workingHours = +(netWorkDurationMinutes / 60).toFixed(2);
  const overtimeHours = +(overtimeMinutes / 60).toFixed(2);

  const officeStart = buildOfficeDateTime(record.shiftDate, settings.officeStartTime, settings.timezone);
  const officeEnd = buildOfficeDateTime(record.shiftDate, settings.officeEndTime, settings.timezone);

  const lateByMinutes = Math.max(0, differenceInMinutes(punchIn, officeStart));
  const isLate = punchIn > officeStart;
  const isEarlyDeparture = punchOutDate < officeEnd;
  const status = calculateStatus(workingHours, settings);

  return {
    workingHours,
    overtimeHours,
    totalBreakDurationMinutes: breakMinutes,
    netWorkDurationMinutes,
    overtimeMinutes,
    lateByMinutes,
    isLate,
    isEarlyDeparture,
    status,
  };
}

async function handlePunchIn(userId, ip, coords) {
  const settings = await getSettings();
  const shiftDate = getTodayShiftDate(settings.timezone);

  // Prevent duplicate punch-in
  const existing = await AttendanceRecord.findOne({ userId, shiftDate });
  if (existing && existing.punchIn) {
    throw new Error('Already punched in for today.');
  }

  // Reject future punch-in (shouldn't happen but guard it)
  const now = new Date();
  if (now > new Date(shiftDate.getTime() + 24 * 60 * 60 * 1000)) {
    throw new Error('Cannot punch in for a future shift.');
  }

  const record = await AttendanceRecord.findOneAndUpdate(
    { userId, shiftDate },
    {
      $set: {
        userId,
        shiftDate,
        punchIn: now,
        status: 'present',
        totalBreakDurationMinutes: 0,
        netWorkDurationMinutes: 0,
        overtimeMinutes: 0,
        isOnBreak: false,
        currentBreakStart: null,
        punchInLocation: { ip, coords: coords || null },
      }
    },
    { upsert: true, new: true }
  );
  return record;
}

async function handlePunchOut(userId, ip, coords) {
  const settings = await getSettings();
  const shiftDate = getTodayShiftDate(settings.timezone);

  const record = await AttendanceRecord.findOne({ userId, shiftDate });
  if (!record || !record.punchIn) {
    throw new Error("No punch-in record found for today. Please punch in first.");
  }
  if (record.punchOut) {
    throw new Error("Already punched out for today.");
  }

  const now = new Date();
  if (now < new Date(record.punchIn)) {
    throw new Error("Punch-out cannot be before punch-in.");
  }

  let totalBreakDurationMinutes = record.totalBreakDurationMinutes || 0;
  let autoClosedBreak = null;

  if (record.isOnBreak && record.currentBreakStart) {
    const openBreak = await AttendanceBreak.findOne({
      attendanceId: record._id,
      breakEnd: null,
    }).sort({ breakStart: -1 });

    const currentBreakStart = new Date(record.currentBreakStart);
    const breakDurationMinutes = Math.max(0, differenceInMinutes(now, currentBreakStart));
    totalBreakDurationMinutes += breakDurationMinutes;

    if (openBreak) {
      openBreak.breakEnd = now;
      openBreak.breakDurationMinutes = breakDurationMinutes;
      await openBreak.save();
    }

    autoClosedBreak = {
      breakStart: currentBreakStart,
      breakEnd: now,
      breakDurationMinutes,
      breakType: openBreak?.breakType || 'custom',
    };
  }

  const derived = calculateFields(record, now, settings, { totalBreakDurationMinutes });

  const updated = await AttendanceRecord.findByIdAndUpdate(
    record._id,
    {
      $set: {
        punchOut: now,
        punchOutLocation: { ip, coords: coords || null },
        isOnBreak: false,
        currentBreakStart: null,
        ...derived,
      }
    },
    { new: true }
  );
  if (autoClosedBreak) {
    updated._autoClosedBreak = autoClosedBreak;
  }
  return updated;
}

async function getTodayRecord(userId) {
  const settings = await getSettings();
  const shiftDate = getTodayShiftDate(settings.timezone);
  return AttendanceRecord.findOne({ userId, shiftDate }).lean();
}

async function getMonthRecords(userId, month, year) {
  const settings = await getSettings();
  const holidays = await getHolidaysForYear(year);

  // Build start/end dates for the month
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // last day of month

  const records = await AttendanceRecord.find({
    userId,
    shiftDate: { $gte: start, $lte: end },
  }).lean();

  // Build a complete day array
  const recordMap = {};
  records.forEach(r => {
    recordMap[formatShiftDate(r.shiftDate, settings.timezone)] = r;
  });

  const days = [];
  let current = new Date(start);
  while (current <= end) {
    const dateStr = formatShiftDate(current, settings.timezone);
    let dayRecord = recordMap[dateStr] || null;

    if (!dayRecord) {
      let status = 'absent';
      if (isWeekend(current, settings.weekends, settings.timezone)) status = 'weekend';
      else if (isHoliday(current, holidays)) status = 'holiday';

      dayRecord = {
        shiftDate: new Date(current),
        status,
        userId,
        _synthetic: true,
      };
    }
    days.push(dayRecord);
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  return days;
}

async function startBreak(userId, breakType = 'lunch') {
  const settings = await getSettings();
  const shiftDate = getTodayShiftDate(settings.timezone);
  const record = await AttendanceRecord.findOne({ userId, shiftDate });

  if (!record || !record.punchIn) {
    throw new Error('Punch in first before starting a break.');
  }
  if (record.punchOut) {
    throw new Error('Shift already ended for today.');
  }
  if (record.isOnBreak) {
    throw new Error('Break is already in progress.');
  }

  const now = new Date();
  record.isOnBreak = true;
  record.currentBreakStart = now;
  await record.save();

  await AttendanceBreak.create({
    attendanceId: record._id,
    breakStart: now,
    breakType: ['lunch', 'short', 'custom'].includes(breakType) ? breakType : 'custom',
  });

  return record;
}

async function endBreak(userId) {
  const settings = await getSettings();
  const shiftDate = getTodayShiftDate(settings.timezone);
  const record = await AttendanceRecord.findOne({ userId, shiftDate });

  if (!record || !record.punchIn) {
    throw new Error('No active attendance record found.');
  }
  if (!record.isOnBreak || !record.currentBreakStart) {
    throw new Error('No active break found.');
  }

  const now = new Date();
  const breakDurationMinutes = Math.max(0, differenceInMinutes(now, new Date(record.currentBreakStart)));
  const openBreak = await AttendanceBreak.findOne({
    attendanceId: record._id,
    breakEnd: null,
  }).sort({ breakStart: -1 });

  if (!openBreak) {
    throw new Error('Open break entry not found.');
  }

  openBreak.breakEnd = now;
  openBreak.breakDurationMinutes = breakDurationMinutes;
  await openBreak.save();

  record.totalBreakDurationMinutes = (record.totalBreakDurationMinutes || 0) + breakDurationMinutes;
  record.isOnBreak = false;
  record.currentBreakStart = null;
  await record.save();

  return { record, breakEntry: openBreak };
}

async function getCurrentStatus(userId) {
  const settings = await getSettings();
  const shiftDate = getTodayShiftDate(settings.timezone);
  const record = await AttendanceRecord.findOne({ userId, shiftDate }).lean();

  if (!record) {
    return {
      serverTime: new Date().toISOString(),
      record: null,
      breaks: [],
      elapsedWorkSeconds: 0,
      totalBreakDurationMinutes: 0,
      ongoingBreakDurationSeconds: 0,
    };
  }

  const breaks = await AttendanceBreak.find({ attendanceId: record._id })
    .sort({ breakStart: 1 })
    .lean();

  const now = new Date();
  const { totalBreakMinutesSoFar, ongoingBreakMinutes } = buildBreakSummary(record, breaks, now);
  const endPoint = record.punchOut ? new Date(record.punchOut) : now;
  const totalShiftSeconds = Math.max(0, differenceInSeconds(endPoint, new Date(record.punchIn)));
  const elapsedWorkSeconds = Math.max(0, totalShiftSeconds - Math.round(totalBreakMinutesSoFar * 60));
  const overtimeSeconds = Math.max(0, elapsedWorkSeconds - (settings.standardHours * 60 * 60));

  return {
    serverTime: now.toISOString(),
    record,
    breaks,
    elapsedWorkSeconds,
    ongoingBreakDurationSeconds: Math.max(0, Math.round(ongoingBreakMinutes * 60)),
    totalBreakDurationMinutes: totalBreakMinutesSoFar,
    overtimeSeconds,
  };
}

module.exports = {
  handlePunchIn,
  handlePunchOut,
  getTodayRecord,
  getMonthRecords,
  calculateFields,
  startBreak,
  endBreak,
  getCurrentStatus,
};
