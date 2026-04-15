const mongoose = require("mongoose");

const managementBusinessReportSchema = new mongoose.Schema(
  {
    reportTitle: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Overview", "Analytics", "Performance", "Report"],
      default: "Overview",
    },
    metricValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Healthy", "Watch", "Critical"],
      default: "Healthy",
    },
    summary: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagementBusinessReport", managementBusinessReportSchema);
