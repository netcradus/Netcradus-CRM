const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  allocated: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },    // applied but not yet approved
  remaining: { type: Number, default: 0 },  // allocated - used - pending
  carried: { type: Number, default: 0 }     // carried over from previous year
}, { timestamps: true });

leaveBalanceSchema.index({ userId: 1, year: 1, leaveTypeId: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
