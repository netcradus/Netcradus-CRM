const { format, parseISO, startOfDay, endOfDay, addDays, differenceInMinutes, differenceInHours } = require('date-fns');
const { toZonedTime, fromZonedTime, format: formatTz } = require('date-fns-tz');

const DEFAULT_TZ = process.env.COMPANY_TIMEZONE || 'Asia/Kolkata';

/**
 * Convert a UTC Date to the company timezone
 */
function toCompanyTimezone(date, tz = DEFAULT_TZ) {
  return toZonedTime(date, tz);
}

/**
 * Convert a company-timezone date back to UTC
 */
function fromCompanyTimezone(date, tz = DEFAULT_TZ) {
  return fromZonedTime(date, tz);
}

/**
 * Get today's shift date (midnight UTC for the company's current calendar date)
 */
function getTodayShiftDate(tz = DEFAULT_TZ) {
  const nowInTz = toZonedTime(new Date(), tz);
  // Build a Date representing YYYY-MM-DD 00:00:00 UTC
  const y = nowInTz.getFullYear();
  const m = nowInTz.getMonth();
  const d = nowInTz.getDate();
  return new Date(Date.UTC(y, m, d));
}

/**
 * Parse a YYYY-MM-DD string and return midnight UTC for that date
 */
function parseShiftDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Format a Date as YYYY-MM-DD in the company timezone
 */
function formatShiftDate(date, tz = DEFAULT_TZ) {
  const zonedDate = toZonedTime(date, tz);
  return formatTz(zonedDate, 'yyyy-MM-dd', { timeZone: tz });
}

/**
 * Check if a given date is a weekend based on weekends config array [0,6]
 */
function isWeekend(date, weekends = [0, 6], tz = DEFAULT_TZ) {
  const zonedDate = toZonedTime(date, tz);
  return weekends.includes(zonedDate.getDay());
}

/**
 * Check if a given date is a company holiday
 * @param {Date} date
 * @param {Date[]} holidays - array of holiday dates
 */
function isHoliday(date, holidays = []) {
  const dateStr = formatShiftDate(date);
  return holidays.some(h => formatShiftDate(new Date(h)) === dateStr);
}

/**
 * Get all working days between start and end (inclusive), excluding weekends & holidays
 * @param {Date} start
 * @param {Date} end
 * @param {Date[]} holidays
 * @param {number[]} weekends
 * @returns {number}
 */
function getWorkingDaysBetween(start, end, holidays = [], weekends = [0, 6], tz = DEFAULT_TZ) {
  let count = 0;
  let current = startOfDay(new Date(start));
  const endDate = startOfDay(new Date(end));

  while (current <= endDate) {
    if (!isWeekend(current, weekends, tz) && !isHoliday(current, holidays)) {
      count++;
    }
    current = addDays(current, 1);
  }
  return count;
}

/**
 * Parse "HH:MM" time string and return { hours, minutes }
 */
function parseTimeStr(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Given a shiftDate (UTC midnight) and a "HH:MM" office time string,
 * return a full UTC Date for that time on that shift day (in company TZ)
 */
function buildOfficeDateTime(shiftDate, timeStr, tz = DEFAULT_TZ) {
  const { hours, minutes } = parseTimeStr(timeStr);
  // shiftDate is midnight UTC, representing a calendar day in company TZ
  const zonedShift = toZonedTime(shiftDate, tz);
  zonedShift.setHours(hours, minutes, 0, 0);
  return fromZonedTime(zonedShift, tz);
}

/**
 * Calculate working hours from punchIn to punchOut in decimal hours
 */
function calcWorkingHours(punchIn, punchOut) {
  const mins = differenceInMinutes(new Date(punchOut), new Date(punchIn));
  return +(mins / 60).toFixed(2);
}

/**
 * Returns the next working day (Mon–Fri) after the given date.
 * If the given date is already a weekday it still returns the NEXT day.
 */
function nextWorkingDay(date, weekends = [0, 6], tz = DEFAULT_TZ) {
  let next = addDays(new Date(date), 1);
  while (isWeekend(next, weekends, tz)) {
    next = addDays(next, 1);
  }
  return next;
}

/**
 * Adds N working days (Mon–Fri) to the given date, skipping weekends.
 */
function addWorkingDays(date, n, weekends = [0, 6], tz = DEFAULT_TZ) {
  let result = new Date(date);
  let daysAdded = 0;
  while (daysAdded < n) {
    result = addDays(result, 1);
    if (!isWeekend(result, weekends, tz)) {
      daysAdded++;
    }
  }
  return result;
}

module.exports = {
  toCompanyTimezone,
  fromCompanyTimezone,
  getTodayShiftDate,
  parseShiftDate,
  formatShiftDate,
  isWeekend,
  isHoliday,
  getWorkingDaysBetween,
  buildOfficeDateTime,
  calcWorkingHours,
  nextWorkingDay,
  addWorkingDays,
};
