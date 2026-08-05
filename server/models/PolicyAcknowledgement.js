const mongoose = require("mongoose");

const policyAcknowledgementSchema = new mongoose.Schema({
  policy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  policyVersion: {
    type: String,
    required: true
  },
  acknowledgedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "acknowledged"],
    default: "acknowledged"
  }
}, { timestamps: true });

// Enforce unique signature per employee per version
policyAcknowledgementSchema.index({ policy: 1, employee: 1, policyVersion: 1 }, { unique: true });

module.exports = mongoose.model("PolicyAcknowledgement", policyAcknowledgementSchema);
