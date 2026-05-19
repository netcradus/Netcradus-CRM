const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["New", "In Progress", "Won", "Lost"],
      default: "New",
    },
    value: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: String,
      required: true,
      trim: true,
    },
    expectedCloseDate: {
      type: Date,
      default: null,
    },
    sourceLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deal", dealSchema);
