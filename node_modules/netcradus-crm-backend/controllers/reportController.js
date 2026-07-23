const { getMonthlyReport, exportMonthlyCsv, getYearlySummary } = require('../services/reportService');
const mongoose = require('mongoose');

// GET /api/attendance/report/monthly?month=MM&year=YYYY&userId=
exports.monthlyReport = async (req, res) => {
  try {
    // --- Input validation ---
    const month = parseInt(req.query.month, 10);
    const year  = parseInt(req.query.year,  10);
    const userId = req.query.userId || String(req.user._id);

    if (!req.query.month || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'month must be a number between 1 and 12.' });
    }
    if (!req.query.year || isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, message: 'year must be a valid four-digit number.' });
    }
    if (!userId || (req.query.userId && !mongoose.Types.ObjectId.isValid(userId))) {
      return res.status(400).json({ success: false, message: 'Invalid userId.' });
    }

    // --- RBAC: non-admin/hr can only see own report ---
    if (!['admin', 'hr', 'super_user'].includes(req.user.role) && String(req.user._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    // --- No-cache headers so browsers always get fresh report data ---
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const data = await getMonthlyReport(userId, month, year);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/report/export?month=MM&year=YYYY&format=csv  (admin/hr)
exports.exportReport = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const csv = await exportMonthlyCsv(month, year);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${year}_${month}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/report/summary?year=YYYY  (admin)
exports.yearlySummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await getYearlySummary(year);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
