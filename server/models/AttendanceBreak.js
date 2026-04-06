const mongoose = require('mongoose');

const attendanceBreakSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceRecord',
      required: true,
      index: true,
    },
    breakStart: {
      type: Date,
      required: true,
    },
    breakEnd: {
      type: Date,
      default: null,
    },
    breakDurationMinutes: {
      type: Number,
      default: 0,
    },
    breakType: {
      type: String,
      enum: ['lunch', 'short', 'custom'],
      default: 'lunch',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

attendanceBreakSchema.index({ attendanceId: 1, createdAt: 1 });

module.exports = mongoose.model('AttendanceBreak', attendanceBreakSchema);
