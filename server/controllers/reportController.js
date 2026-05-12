const { getMonthlyReport, exportMonthlyCsv, getYearlySummary } = require('../services/reportService');

// GET /api/attendance/report/monthly?month=MM&year=YYYY&userId=
exports.monthlyReport = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const userId = req.query.userId || req.user._id;
    // Security: non-admin can only see own
    if (!['admin', 'hr', 'super_user'].includes(req.user.role) && String(req.user._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const data = await getMonthlyReport(userId, month, year);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
