const mongoose = require("mongoose");

const meetingReminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    meetingLink: {
      type: String,
      required: true,
      trim: true,
    },
    meetingAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    oneHourReminderSentAt: {
      type: Date,
      default: null,
    },
    fifteenMinuteReminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

meetingReminderSchema.index({ createdBy: 1, meetingAt: 1 });
meetingReminderSchema.index({ meetingAt: 1, oneHourReminderSentAt: 1, fifteenMinuteReminderSentAt: 1 });

module.exports = mongoose.model("MeetingReminder", meetingReminderSchema);
