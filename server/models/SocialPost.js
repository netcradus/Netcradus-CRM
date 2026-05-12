const mongoose = require("mongoose");

const socialPostSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    platforms: [{ type: String, required: true }],
    scheduledAt: { type: Date, default: null },
    postedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "scheduled", "posted", "failed"],
      default: "draft",
    },
    mediaUrl: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approvalStatus: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "draft",
    },
    approvalReason: { type: String, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialPost", socialPostSchema);
