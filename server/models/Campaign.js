const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  channel: { type: String, required: true },
  status: { type: String, enum: ["Active", "Paused"], default: "Active" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budgetAllocated: { type: Number, default: 0 },
  budgetSpent: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: {
    type: String,
    enum: ["draft", "pending_review", "approved", "rejected"],
    default: "draft",
  },
  approvalReason: { type: String, default: "" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  approvedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Campaign", campaignSchema);
