const mongoose = require('mongoose');

const attendanceSettingsSchema = new mongoose.Schema({
  officeStartTime: { type: String, required: true, default: "09:30" }, // e.g. "09:30"
  officeEndTime: { type: String, required: true, default: "18:00" },   // e.g. "18:00"
  standardHours: { type: Number, required: true, default: 8 },         // 8
  minHoursForPresent: { type: Number, required: true, default: 4 },    // 4 (below = half day)
  maxShiftHours: { type: Number, required: true, default: 12 },        // 12 (auto punch-out threshold)
  weekends: { type: [Number], default: [0, 6] },                       // [0, 6] = Sunday, Saturday (JS day index)
  timezone: { type: String, required: true, default: "Asia/Kolkata" }, // "Asia/Kolkata"
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceSettings', attendanceSettingsSchema);
