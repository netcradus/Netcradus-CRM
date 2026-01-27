const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  channel: { type: String, required: true },
  status: { type: String, enum: ["Active", "Paused"], default: "Active" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Campaign", campaignSchema);
