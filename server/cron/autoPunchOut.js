const AttendanceRecord = require('../models/AttendanceRecord');
const { getSettings } = require('../config/attendanceSettings');
const { calculateFields } = require('../services/attendanceService');

/**
 * Auto punch-out: find records where punchIn exists, punchOut is null,
 * and punchIn was > maxShiftHours ago.
 * Set punchOut = punchIn + maxShiftHours, mark autoPunchedOut: true
 */
async function autoPunchOut() {
  try {
    const settings = await getSettings();
    const maxMs = settings.maxShiftHours * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - maxMs);

    const openRecords = await AttendanceRecord.find({
      punchIn: { $ne: null, $lte: cutoff },
      punchOut: null,
    });

    let count = 0;
    for (const record of openRecords) {
      const autoPunchOutTime = new Date(record.punchIn.getTime() + maxMs);
      const derived = calculateFields(record, autoPunchOutTime, settings);

      await AttendanceRecord.findByIdAndUpdate(record._id, {
        $set: {
          punchOut: autoPunchOutTime,
          autoPunchedOut: true,
          ...derived,
        }
      });
      count++;
    }

    if (count > 0) {
      console.log(`[CRON autoPunchOut] Auto punched out ${count} record(s).`);
    }
    return count;
  } catch (err) {
    console.error('[CRON autoPunchOut] Error:', err.message);
  }
}

module.exports = autoPunchOut;
