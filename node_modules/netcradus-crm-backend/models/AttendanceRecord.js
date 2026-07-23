const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shiftDate: { type: Date, required: true },   // YYYY-MM-DD at midnight UTC
  punchIn: { type: Date },
  punchOut: { type: Date },
  workingHours: { type: Number, default: 0 },        // calculated on punch-out
  overtimeHours: { type: Number, default: 0 },
  totalBreakDurationMinutes: { type: Number, default: 0 },
  netWorkDurationMinutes: { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 },
  isOnBreak: { type: Boolean, default: false },
  currentBreakStart: { type: Date, default: null },
  lateByMinutes: { type: Number, default: 0 },
  isLate: { type: Boolean, default: false },
  isEarlyDeparture: { type: Boolean, default: false },
  autoPunchedOut: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['present', 'half_day', 'absent', 'on_leave', 'holiday', 'weekend'],
    default: 'absent'
  },
  punchInLocation: {
    ip: String,
    coords: { lat: Number, lng: Number }   // optional
  },
  punchOutLocation: {
    ip: String,
    coords: { lat: Number, lng: Number }
  },
  notes: { type: String },
}, { timestamps: true });

// Ensure one record per user per shiftDay
attendanceRecordSchema.index({ userId: 1, shiftDate: 1 }, { unique: true });
attendanceRecordSchema.index({ shiftDate: 1 });
attendanceRecordSchema.index({ punchOut: 1, punchIn: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
