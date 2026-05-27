const mongoose = require("mongoose");

const zohoAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    zohoEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    zohoAccountId: {
      type: String,
      required: true,
    },
    displayName: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ZohoAccount", zohoAccountSchema);
