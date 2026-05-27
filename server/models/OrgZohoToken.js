const mongoose = require("mongoose");

const orgZohoTokenSchema = new mongoose.Schema(
  {
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    encryptionIv: {
      type: String,
      required: true,
    },
    refreshEncryptionIv: {
      type: String,
      required: true,
    },
    accessAuthTag: {
      type: String,
      required: true,
    },
    refreshAuthTag: {
      type: String,
      required: true,
    },
    expiresAt: Date,
    scope: String,
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastRefreshedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrgZohoToken", orgZohoTokenSchema);
