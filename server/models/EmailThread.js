const mongoose = require("mongoose");

const emailThreadSchema = new mongoose.Schema(
  {
    zohoMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    zohoThreadId: {
      type: String,
      index: true,
    },
    zohoAccountId: String,
    zohoFolderId: String,
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    subject: String,
    fromAddress: String,
    toAddresses: [String],
    snippet: String,
    hasAttachments: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    folder: String,
    receivedAt: Date,
    linkedEntityType: {
      type: String,
      enum: ["lead", "contact", "deal", "account", null],
      default: null,
    },
    linkedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    linkedAt: Date,
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    crmNote: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

emailThreadSchema.index({ ownerUserId: 1, folder: 1, receivedAt: -1 });
emailThreadSchema.index({ ownerUserId: 1, linkedEntityType: 1, linkedEntityId: 1 });

module.exports = mongoose.model("EmailThread", emailThreadSchema);
