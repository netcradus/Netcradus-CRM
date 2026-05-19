const mongoose = require("mongoose");

const meetingTimelineEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        "meeting_scheduled",
        "meeting_rescheduled",
        "meeting_held",
        "outcome_set",
        "note_added",
        "converted_to_deal",
        "dropped",
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: true }
);

const meetingTimelineSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
    unique: true,
    index: true,
  },
  events: {
    type: [meetingTimelineEventSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

meetingTimelineSchema.pre("save", function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("MeetingTimeline", meetingTimelineSchema);
