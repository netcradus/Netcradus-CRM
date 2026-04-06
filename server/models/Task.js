const mongoose = require("mongoose");

const taskHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "reviewed"],
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
      enum: ["pending", "in_progress", "completed", "reviewed"],
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

module.exports = mongoose.model("Task", taskSchema);
