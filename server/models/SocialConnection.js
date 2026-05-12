const mongoose = require("mongoose");

const socialConnectionSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["facebook", "instagram", "x", "linkedin", "whatsapp_business"],
      required: true,
    },
    accessToken: { type: String, required: true },
    accountName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

socialConnectionSchema.index({ platform: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("SocialConnection", socialConnectionSchema);
