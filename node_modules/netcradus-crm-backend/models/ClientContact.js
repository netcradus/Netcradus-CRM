const mongoose = require("mongoose");

const clientContactSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },
    preferredContactMethod: {
      type: String,
      enum: ["Email", "Phone", "WhatsApp"],
      default: "Email",
    },
    contactType: {
      type: String,
      enum: ["Primary", "Billing", "Technical", "Support", "Decision Maker", "Other"],
      default: "Other",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    supportAccessEnabled: {
      type: Boolean,
      default: false,
    },
    linkedSupportUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to quick-lookup specific contact within client
clientContactSchema.index({ clientId: 1, email: 1 });

module.exports = mongoose.model("ClientContact", clientContactSchema);
