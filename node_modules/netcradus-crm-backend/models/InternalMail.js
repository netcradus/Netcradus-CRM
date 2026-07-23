const mongoose = require("mongoose");

const internalMailSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },
    body: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: ""
    },
    attachments: [
      {
        filename: { type: String, required: true },
        originalname: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
        path: { type: String, required: true }
      }
    ],
    status: {
      type: String,
      enum: ["sent", "draft"],
      default: "draft",
      required: true
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
      }
    ],
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
      }
    ],
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
      }
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternalMail",
      default: null
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternalMail",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

internalMailSchema.index({ sender: 1, status: 1 });
internalMailSchema.index({ recipients: 1, status: 1 });
internalMailSchema.index({ deletedBy: 1 });

module.exports = mongoose.model("InternalMail", internalMailSchema);
