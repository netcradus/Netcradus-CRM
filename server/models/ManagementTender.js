const mongoose = require("mongoose");

const managementTenderSchema = new mongoose.Schema(
  {
    tenderName: { type: String, required: true, trim: true },
    clientName: { type: String, trim: true, default: "" },
    bidValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Open", "Submitted", "Won", "Lost", "In Review"],
      default: "Open",
    },
    submissionDate: { type: Date },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagementTender", managementTenderSchema);
