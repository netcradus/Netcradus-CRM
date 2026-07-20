const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal"
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    targetType: {
      type: String,
      enum: ["all", "department", "role", "selected_users"],
      required: true
    },
    targetDepartments: {
      type: [String],
      default: []
    },
    targetRoles: {
      type: [String],
      default: []
    },
    targetUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    recipientUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true
    },
    readBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

broadcastSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Broadcast", broadcastSchema);
