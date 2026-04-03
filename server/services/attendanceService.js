const { differenceInMinutes } = require('date-fns');
const AttendanceRecord = require('../models/AttendanceRecord');
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

function calculateFields(record, punchOut, settings) {
  const punchIn = new Date(record.punchIn);
  const punchOutDate = new Date(punchOut);
  const workingHours = calcWorkingHours(punchIn, punchOutDate);
  const overtimeHours = Math.max(0, +(workingHours - settings.standardHours).toFixed(2));

  const officeStart = buildOfficeDateTime(record.shiftDate, settings.officeStartTime, settings.timezone);
  const officeEnd = buildOfficeDateTime(record.shiftDate, settings.officeEndTime, settings.timezone);

  const lateByMinutes = Math.max(0, differenceInMinutes(punchIn, officeStart));
  const isLate = punchIn > officeStart;
  const isEarlyDeparture = punchOutDate < officeEnd;
  const status = calculateStatus(workingHours, settings);

  return { workingHours, overtimeHours, lateByMinutes, isLate, isEarlyDeparture, status };
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

  const derived = calculateFields(record, now, settings);

  const updated = await AttendanceRecord.findByIdAndUpdate(
    record._id,
    {
      $set: {
        punchOut: now,
        punchOutLocation: { ip, coords: coords || null },
        ...derived,
      }
    },
    { new: true }
  );
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

module.exports = { handlePunchIn, handlePunchOut, getTodayRecord, getMonthRecords, calculateFields };
