const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    assignedTo: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved"],
      default: "Open",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema);
