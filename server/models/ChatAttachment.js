const mongoose = require("mongoose");

const chatAttachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatAttachment", chatAttachmentSchema);
