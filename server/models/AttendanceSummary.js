const mongoose = require('mongoose');

const attendanceSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },   // 1-12
  year: { type: Number, required: true },
  totalWorkingDays: { type: Number, default: 0 },
  present: { type: Number, default: 0 },
  absent: { type: Number, default: 0 },
  halfDay: { type: Number, default: 0 },
  onLeave: { type: Number, default: 0 },
  holidays: { type: Number, default: 0 },
  weekends: { type: Number, default: 0 },
  totalHoursWorked: { type: Number, default: 0 },
  totalOvertime: { type: Number, default: 0 },
  lateCount: { type: Number, default: 0 },
  earlyDepartureCount: { type: Number, default: 0 },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

attendanceSummarySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSummary', attendanceSummarySchema);
