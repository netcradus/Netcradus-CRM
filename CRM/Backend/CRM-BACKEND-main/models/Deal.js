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
  },
  { timestamps: true } // automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Deal", dealSchema);
