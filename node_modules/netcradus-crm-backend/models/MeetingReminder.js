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
      required: false,
      trim: true,
    },
    meetingAt: {
      type: Date,
      required: false,
    },
    meetingDateTime: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    notificationDelivery: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        oneHourSentAt: {
          type: Date,
          default: null,
        },
        fifteenMinuteSentAt: {
          type: Date,
          default: null,
        },
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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

// Indexes for user search, cron job, and status query optimization
meetingReminderSchema.index({ createdBy: 1, meetingDateTime: 1 });
meetingReminderSchema.index({ status: 1, meetingDateTime: 1 });
meetingReminderSchema.index({ participants: 1 });
meetingReminderSchema.index({ participants: 1, meetingDateTime: 1 });
meetingReminderSchema.index({
  meetingDateTime: 1,
  oneHourReminderSentAt: 1,
  fifteenMinuteReminderSentAt: 1,
  status: 1,
});

module.exports = mongoose.model("MeetingReminder", meetingReminderSchema);
