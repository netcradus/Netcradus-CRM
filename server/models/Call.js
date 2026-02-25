const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    callerName: {
      type: String,
      required: true,
      trim: true,
    },
    callType: {
      type: String,
      enum: ["Inbound", "Outgoing", "Missed"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Connected", "Missed", "Voicemail"],
      default: "Connected",
    },
    time: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    associatedAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    associatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);
