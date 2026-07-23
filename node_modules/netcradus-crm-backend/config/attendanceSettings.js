const AttendanceSettings = require('../models/AttendanceSettings');

let cachedSettings = null;

async function getSettings() {
  if (cachedSettings) return cachedSettings;

  let settings = await AttendanceSettings.findOne();
  if (!settings) {
    // Bootstrap defaults from ENV
    settings = await AttendanceSettings.create({
      officeStartTime: process.env.OFFICE_START_TIME || '10:00',
      officeEndTime: process.env.OFFICE_END_TIME || '19:00',
      standardHours: Number(process.env.STANDARD_HOURS) || 8,
      minHoursForPresent: Number(process.env.MIN_HOURS_FOR_PRESENT) || 4,
      maxShiftHours: Number(process.env.MAX_SHIFT_HOURS) || 12,
      weekends: (process.env.WEEKEND_DAYS || '0,6').split(',').map(Number),
      timezone: process.env.COMPANY_TIMEZONE || 'Asia/Kolkata',
    });
  }

  cachedSettings = settings.toObject();
  return cachedSettings;
}

function invalidateCache() {
  cachedSettings = null;
}

module.exports = { getSettings, invalidateCache };
