const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceBreak = require('../models/AttendanceBreak');
const AttendanceSettings = require('../models/AttendanceSettings');
const RegularizationRequest = require('../models/RegularizationRequest');
const AuditLog = require('../models/AuditLog');
const {
  handlePunchIn,
  handlePunchOut,
  getTodayRecord,
  getMonthRecords,
  calculateFields,
  startBreak,
  endBreak,
  getCurrentStatus: getCurrentAttendanceStatus,
} = require('../services/attendanceService');
const { getIpGeoLocation } = require('../services/securityService');
const { getSettings, invalidateCache } = require('../config/attendanceSettings');
const User = require('../models/User');
const LeaveApplication = require('../models/LeaveApplication');
const { getTodayShiftDate, isWeekend, isHoliday } = require('../utils/dateUtils');
const { getHolidaysForYear } = require('../services/holidayService');
const { differenceInMinutes } = require('date-fns');

// POST /api/attendance/punch-in
exports.punchIn = async (req, res) => {
  try {
    const userId = req.user._id;
    if (req.user.role === 'super_user') {
      return res.status(403).json({ success: false, message: 'Super users are exempt from attendance tracking.' });
    }
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    let coords = req.body.coords || null;

    // Background Geolocation if missing
    if (!coords && ip !== 'unknown') {
      try {
        const geo = await getIpGeoLocation(ip);
        if (geo) {
          coords = { latitude: geo.lat, longitude: geo.lon };
        }
      } catch (geoErr) {
        console.warn(`[Attendance] Geolocation failed for IP ${ip}:`, geoErr.message);
      }
    }

    const record = await handlePunchIn(userId, ip, coords);
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/punch-out
exports.punchOut = async (req, res) => {
  try {
    const userId = req.user._id;
    if (req.user.role === 'super_user') {
      return res.status(403).json({ success: false, message: 'Super users are exempt from attendance tracking.' });
    }
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const coords = req.body.coords || null;
    const record = await handlePunchOut(userId, ip, coords);
    res.status(200).json({
      success: true,
      data: record,
      message: record._autoClosedBreak
        ? 'Break auto-closed on punch out.'
        : 'Punched out successfully.',
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/today
exports.getToday = async (req, res) => {
  try {
    const record = await getTodayRecord(req.user._id);
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/break-start
exports.breakStart = async (req, res) => {
  try {
    if (req.user.role === 'super_user') {
      return res.status(403).json({ success: false, message: 'Super users are exempt from attendance tracking.' });
    }

    const breakType = req.body.breakType || 'lunch';
    const record = await startBreak(req.user._id, breakType);
    const status = await getCurrentAttendanceStatus(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Break started successfully.',
      data: { ...status, record },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/break-end
exports.breakEnd = async (req, res) => {
  try {
    if (req.user.role === 'super_user') {
      return res.status(403).json({ success: false, message: 'Super users are exempt from attendance tracking.' });
    }

    const { record, breakEntry } = await endBreak(req.user._id);
    const status = await getCurrentAttendanceStatus(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Break ended successfully.',
      data: { ...status, record, latestBreak: breakEntry },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/current-status
exports.getCurrentStatus = async (req, res) => {
  try {
    if (req.user.role === 'super_user') {
      return res.status(403).json({ success: false, message: 'Super users are exempt from attendance tracking.' });
    }

    const status = await getCurrentAttendanceStatus(req.user._id);
    res.status(200).json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/my?month=MM&year=YYYY
exports.getMyAttendance = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const days = await getMonthRecords(req.user._id, month, year);
    res.status(200).json({ success: true, data: days });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/user/:userId?month=MM&year=YYYY  (admin/hr only)
exports.getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const days = await getMonthRecords(userId, month, year);
    res.status(200).json({ success: true, data: days });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/team?month=MM&year=YYYY&page=1&limit=20  (admin/hr only)
exports.getTeamAttendance = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({}).select('_id name email role').skip(skip).limit(limit).lean();
    const total = await User.countDocuments();

    const teamData = await Promise.all(
      users.map(async u => {
        const days = await getMonthRecords(u._id, month, year);
        const present = days.filter(d => d.status === 'present').length;
        const absent = days.filter(d => d.status === 'absent').length;
        const halfDay = days.filter(d => d.status === 'half_day').length;
        const onLeave = days.filter(d => d.status === 'on_leave').length;
        return { user: u, present, absent, halfDay, onLeave };
      })
    );

    res.status(200).json({ success: true, data: teamData, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/regularize — employee requests correction
exports.applyRegularization = async (req, res) => {
  try {
    const { date, requestedPunchIn, requestedPunchOut, reason } = req.body;
    if (!date || !requestedPunchIn || !requestedPunchOut || !reason) {
      return res.status(400).json({ success: false, message: 'date, requestedPunchIn, requestedPunchOut, reason are required.' });
    }
    const req_ = await RegularizationRequest.create({
      userId: req.user._id,
      date: new Date(date),
      requestedPunchIn: new Date(requestedPunchIn),
      requestedPunchOut: new Date(requestedPunchOut),
      reason,
    });
    res.status(201).json({ success: true, data: req_ });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/regularize  (admin/hr)
exports.getRegularizations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reqs, total] = await Promise.all([
      RegularizationRequest.find(query).populate('userId', 'name email').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      RegularizationRequest.countDocuments(query),
    ]);
    res.status(200).json({ success: true, data: reqs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/attendance/regularize/:id/approve
exports.approveRegularization = async (req, res) => {
  try {
    const reg = await RegularizationRequest.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (reg.status !== 'pending') return res.status(400).json({ success: false, message: 'Already reviewed.' });

    const settings = await getSettings();
    // Apply to actual attendance record
    const derived = calculateFields({ punchIn: reg.requestedPunchIn, shiftDate: reg.date }, reg.requestedPunchOut, settings);
    await AttendanceRecord.findOneAndUpdate(
      { userId: reg.userId, shiftDate: reg.date },
      {
        $set: {
          punchIn: reg.requestedPunchIn,
          punchOut: reg.requestedPunchOut,
          ...derived,
          notes: `Regularized by ${req.user.name || req.user.email}`,
        }
      },
      { upsert: true }
    );

    reg.status = 'approved';
    reg.reviewedBy = req.user._id;
    reg.reviewedAt = new Date();
    reg.reviewNote = req.body.reviewNote || '';
    await reg.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'REGULARIZATION_APPROVED',
      targetId: reg._id,
      targetModel: 'RegularizationRequest',
      details: { forUser: reg.userId },
    });

    res.status(200).json({ success: true, data: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/attendance/regularize/:id/reject
exports.rejectRegularization = async (req, res) => {
  try {
    const reg = await RegularizationRequest.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (reg.status !== 'pending') return res.status(400).json({ success: false, message: 'Already reviewed.' });

    reg.status = 'rejected';
    reg.reviewedBy = req.user._id;
    reg.reviewedAt = new Date();
    reg.reviewNote = req.body.reviewNote || '';
    await reg.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'REGULARIZATION_REJECTED',
      targetId: reg._id,
      targetModel: 'RegularizationRequest',
      details: { forUser: reg.userId },
    });

    res.status(200).json({ success: true, data: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/settings  (admin only)
exports.getAttendanceSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/attendance/settings  (admin only)
exports.updateAttendanceSettings = async (req, res) => {
  try {
    const allowed = ['officeStartTime', 'officeEndTime', 'standardHours', 'minHoursForPresent', 'maxShiftHours', 'weekends', 'timezone'];
    const update = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) update[key] = req.body[key]; });
    update.updatedBy = req.user._id;

    const settings = await AttendanceSettings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
    invalidateCache();

    await AuditLog.create({
      userId: req.user._id,
      action: 'ATTENDANCE_SETTINGS_UPDATED',
      details: update,
    });

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/admin/today-snapshot
exports.getTodaySnapshot = async (req, res) => {
  try {
    const settings = await getSettings();
    const shiftDate = getTodayShiftDate(settings.timezone);
    const holidays = await getHolidaysForYear(shiftDate.getFullYear());
    const isWknd = isWeekend(shiftDate, settings.weekends, settings.timezone);
    const isHldy = isHoliday(shiftDate, holidays);

    // Fetch all active non-super_user users
    const users = await User.find({ isActive: { $ne: false }, role: { $ne: 'super_user' } })
      .select('name email role department')
      .lean();

    // Fetch today's records and approved leaves
    const [records, leaves] = await Promise.all([
      AttendanceRecord.find({ shiftDate }).lean(),
      LeaveApplication.find({
        status: 'approved',
        from: { $lte: shiftDate },
        to: { $gte: shiftDate },
      }).lean(),
    ]);
    const attendanceIds = records.map((record) => record._id);
    const breaks = attendanceIds.length
      ? await AttendanceBreak.find({ attendanceId: { $in: attendanceIds } }).lean()
      : [];

    const recordMap = new Map(records.map(r => [r.userId.toString(), r]));
    const leaveMap = new Map(leaves.map(l => [l.userId.toString(), l]));
    const breaksByAttendance = breaks.reduce((acc, item) => {
      const key = String(item.attendanceId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const employees = users.map(u => {
      const rec = recordMap.get(u._id.toString());
      const leave = leaveMap.get(u._id.toString());
      
      let status = 'absent';
      let warning = null;

      if (rec) {
        status = rec.status;
        if (status === 'present' && rec.punchIn && !rec.punchOut) {
          const breakMinutesSoFar = (rec.totalBreakDurationMinutes || 0)
            + (rec.isOnBreak && rec.currentBreakStart
              ? Math.max(0, differenceInMinutes(new Date(), new Date(rec.currentBreakStart)))
              : 0);
          const elapsedMinutes = Math.max(0, differenceInMinutes(new Date(), new Date(rec.punchIn)) - breakMinutesSoFar);
          const elapsedHours = elapsedMinutes / 60;
          if (elapsedHours > settings.standardHours) status = 'overtime';
          if (elapsedHours > (settings.standardHours + 2)) warning = 'overworked';
        } else if (rec.overtimeHours > 0) {
          status = 'overtime';
          if (rec.workingHours > (settings.standardHours + 2)) warning = 'overworked';
        }
      } else if (leave) {
        status = 'on_leave';
      } else if (isWknd) {
        status = 'weekend';
      } else if (isHldy) {
        status = 'holiday';
      }

      return {
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || 'General',
        status,
        warning,
        punchIn: rec?.punchIn || null,
        punchOut: rec?.punchOut || null,
        workingHours: rec?.workingHours || 0,
        overtimeHours: rec?.overtimeHours || 0,
        totalBreakDurationMinutes: rec?.totalBreakDurationMinutes || 0,
        netWorkDurationMinutes: rec?.netWorkDurationMinutes || 0,
        overtimeMinutes: rec?.overtimeMinutes || 0,
        isOnBreak: rec?.isOnBreak || false,
        currentBreakStart: rec?.currentBreakStart || null,
        breaks: rec?._id ? (breaksByAttendance[String(rec._id)] || []) : [],
        isLate: rec?.isLate || false,
        lateByMinutes: rec?.lateByMinutes || 0,
        leaveType: leave?.leaveType || null,
        leaveDates: leave ? { from: leave.from, to: leave.to } : null,
      };
    });

    const stats = {
      presentCount: employees.filter(e => ['present', 'overtime', 'half_day'].includes(e.status)).length,
      clockedInCount: employees.filter(e => e.punchIn && !e.punchOut).length,
      lateCount: employees.filter(e => e.isLate).length,
      onLeaveCount: employees.filter(e => e.status === 'on_leave').length,
      absentCount: employees.filter(e => e.status === 'absent').length,
      overtimeCount: employees.filter(e => e.status === 'overtime').length,
    };

    res.status(200).json({ success: true, data: { ...stats, employees } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/admin/pending-actions
exports.getPendingActions = async (req, res) => {
  try {
    const [pendingLeaves, pendingRegularizations] = await Promise.all([
      LeaveApplication.find({ status: 'pending' }).populate('userId', 'name role department email').sort({ createdAt: 1 }).lean(),
      RegularizationRequest.find({ status: 'pending' }).populate('userId', 'name role department email').sort({ createdAt: 1 }).lean(),
    ]);

    res.status(200).json({ success: true, data: { pendingLeaves, pendingRegularizations } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
