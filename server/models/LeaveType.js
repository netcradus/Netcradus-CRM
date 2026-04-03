const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },               // "Casual Leave"
  code: { type: String, required: true, unique: true }, // "CL"
  defaultDaysPerYear: { type: Number, required: true },
  noticePeriodDays: { type: Number, default: 0 },
  allowHalfDay: { type: Boolean, default: false },
  isCarryForward: { type: Boolean, default: false },
  maxCarryForwardDays: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
