const mongoose = require("mongoose");

const teamMeetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    meetingType: {
      type: String,
      enum: [
        "team_meeting",
        "one_to_one",
        "project_review",
        "daily_standup",
        "performance_review",
        "training",
        "internal_discussion",
      ],
      required: true,
    },
    agenda: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participants: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      required: true,
      default: [],
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    meetingDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    reminderMinutes: {
      type: Number,
      default: 30,
    },
    cancelReason: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index for queries by participants and date
teamMeetingSchema.index({ participants: 1, meetingDate: 1 });

module.exports = mongoose.model("TeamMeeting", teamMeetingSchema);
