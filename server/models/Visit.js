import mongoose from "mongoose";

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

export default mongoose.model("Visit", visitSchema);