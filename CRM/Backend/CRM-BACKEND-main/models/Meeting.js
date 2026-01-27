// models/Meeting.js
const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Users attending the meeting
      },
    ],
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "Deferred"],
      default: "Scheduled",
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // User who created the meeting
    },
    associatedAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account", // Related CRM account
    },
    associatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead", // Related CRM lead
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
