const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  totalDays: { type: Number, default: 0 },   // calculated working days only
  isHalfDay: { type: Boolean, default: false },
  halfDaySession: { type: String, enum: ['morning', 'afternoon'] },
  reason: { type: String, maxlength: 500 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  appliedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String },
  cancelRequestedAt: { type: Date },
  cancelApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: [String]  // optional — link to uploaded docs
}, { timestamps: true });

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
