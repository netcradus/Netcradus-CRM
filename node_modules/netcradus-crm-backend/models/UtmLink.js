const mongoose = require("mongoose");

const utmLinkSchema = new mongoose.Schema(
  {
    destinationUrl: { type: String, required: true, trim: true },
    utmSource: { type: String, required: true, trim: true },
    utmMedium: { type: String, required: true, trim: true },
    utmCampaignName: { type: String, required: true, trim: true },
    utmTerm: { type: String, default: "", trim: true },
    utmContent: { type: String, default: "", trim: true },
    generatedUrl: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UtmLink", utmLinkSchema);
