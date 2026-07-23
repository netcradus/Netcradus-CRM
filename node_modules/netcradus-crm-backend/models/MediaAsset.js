const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    fileType: { type: String, required: true, trim: true },
    fileSize: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    linkedCampaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Campaign" }],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MediaAsset", mediaAssetSchema);
