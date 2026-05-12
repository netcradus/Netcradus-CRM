const mongoose = require("mongoose");

const socialInboxItemSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["facebook", "instagram", "x", "linkedin", "whatsapp_business"],
      required: true,
    },
    senderName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    timestamp: { type: Date, required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    status: {
      type: String,
      enum: ["new", "read", "replied"],
      default: "new",
    },
    replyText: { type: String, default: "", trim: true },
    repliedAt: { type: Date, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialInboxItem", socialInboxItemSchema);
