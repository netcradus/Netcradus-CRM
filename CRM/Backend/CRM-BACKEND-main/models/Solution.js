const mongoose = require("mongoose");

const solutionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Delivered", "In Progress", "Pending"],
      default: "Pending",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);
