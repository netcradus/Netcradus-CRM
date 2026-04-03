const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');
const { invalidateHolidayCache } = require('../services/holidayService');

// GET /api/holidays?year=YYYY  (all authenticated users)
exports.getHolidays = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const holidays = await Holiday.find({ year, isActive: true }).sort({ date: 1 }).lean();
    res.status(200).json({ success: true, data: holidays });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/holidays  (admin only)
exports.createHoliday = async (req, res) => {
  try {
    const { name, date, type } = req.body;
    if (!name || !date) return res.status(400).json({ success: false, message: 'name and date are required.' });
    const d = new Date(date);
    const year = d.getFullYear();
    const holiday = await Holiday.create({ name, date: d, year, type: type || 'national', createdBy: req.user._id });
    invalidateHolidayCache(year);
    res.status(201).json({ success: true, data: holiday });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/holidays/:id  (admin only)
exports.updateHoliday = async (req, res) => {
  try {
    const { name, date, type, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (date !== undefined) { update.date = new Date(date); update.year = new Date(date).getFullYear(); }
    if (type !== undefined) update.type = type;
    if (isActive !== undefined) update.isActive = isActive;

    const holiday = await Holiday.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found.' });
    invalidateHolidayCache(holiday.year);
    res.status(200).json({ success: true, data: holiday });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/holidays/:id  (admin only)
exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found.' });
    invalidateHolidayCache(holiday.year);
    await AuditLog.create({
      userId: req.user._id,
      action: 'HOLIDAY_DELETED',
      targetId: holiday._id,
      details: { name: holiday.name },
    });
    res.status(200).json({ success: true, message: 'Holiday deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
