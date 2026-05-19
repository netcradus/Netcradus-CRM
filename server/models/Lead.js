const mongoose = require("mongoose");

const leadNoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      maxlength: 3000,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const callLogSchema = new mongoose.Schema(
  {
    calledAt: {
      type: Date,
      default: Date.now,
    },
    calledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    outcome: {
      type: String,
      enum: ["no_answer", "call_back", "not_interested", "meeting_aligned", "other"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["not_interested", "call_back", "meeting_aligned"],
      default: "call_back",
    },
    notes: {
      type: [leadNoteSchema],
      default: [],
    },
    meetingScheduledAt: {
      type: Date,
      default: null,
    },
    meetingLocation: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },
    meetingType: {
      type: String,
      enum: ["in_person", "video_call", "phone_call"],
      default: null,
    },
    meetingNotes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    meetingOutcome: {
      type: String,
      enum: ["pending", "converted", "dropped", "rescheduled"],
      default: null,
    },
    rescheduledAt: {
      type: Date,
      default: null,
    },
    convertedToDealAt: {
      type: Date,
      default: null,
    },
    convertedToDealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },
    callLog: {
      type: [callLogSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

leadSchema.index({ status: 1 });
leadSchema.index({ meetingScheduledAt: 1 });
leadSchema.index({ convertedToDealAt: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({
  name: "text",
  email: "text",
  company: "text",
  phone: "text",
});

module.exports = mongoose.model("Lead", leadSchema);
