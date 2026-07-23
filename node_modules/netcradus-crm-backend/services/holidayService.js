const Holiday = require('../models/Holiday');

let holidayCache = {}; // keyed by year

async function getHolidaysForYear(year) {
  if (holidayCache[year]) return holidayCache[year];
  const holidays = await Holiday.find({ year, isActive: true }).lean();
  holidayCache[year] = holidays.map(h => h.date);
  return holidayCache[year];
}

function invalidateHolidayCache(year) {
  if (year) {
    delete holidayCache[year];
  } else {
    holidayCache = {};
  }
}

module.exports = { getHolidaysForYear, invalidateHolidayCache };
