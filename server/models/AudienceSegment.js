const mongoose = require("mongoose");

const audienceSegmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    estimatedSize: { type: Number, default: 0 },
    channel: {
      type: String,
      enum: ["Email", "Social", "PPC", "Direct Mail"],
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AudienceSegment", audienceSegmentSchema);
