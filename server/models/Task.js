const mongoose = require("mongoose");

const taskHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "reviewed", "queued", "active"],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "reviewed", "queued", "active"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    estimatedDuration: {
      type: String,
      trim: true,
      default: "",
    },
    // Smart Queue Scheduling Fields
    estimatedHours: {
      type: Number,
      default: null,
    },
    queuePosition: {
      type: Number,
      default: null,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    actualStartDate: {
      type: Date,
      default: null,
    },
    queuedAt: {
      type: Date,
      default: null,
    },
    completionTime: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [taskHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ role: 1, priority: 1, dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ assignedTo: 1, queuePosition: 1 }); // queue ordering

module.exports = mongoose.model("Task", taskSchema);
