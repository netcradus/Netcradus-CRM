const mongoose = require("mongoose");

const taskNotificationSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    targetPath: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "task",
        "task_completed",
        "storage_low",
        "general",
        "self_task_approval_requested",
        "self_task_approved",
        "self_task_rejected",
      ],
      default: "general"
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

taskNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("TaskNotification", taskNotificationSchema);
