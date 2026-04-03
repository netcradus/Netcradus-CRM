const mongoose = require('mongoose');

const regularizationRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  requestedPunchIn: { type: Date, required: true },
  requestedPunchOut: { type: Date, required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RegularizationRequest', regularizationRequestSchema);
