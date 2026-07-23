const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  client: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled"],
    default: "Scheduled",
  },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model("Visit", visitSchema);