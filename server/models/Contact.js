// models/Contact.js
const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Prospect", "Lead", "Customer", "Employee", "Ex-Employee"],
      default: "Prospect",
    },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    joiningDate: { type: Date },
    leavingDate: { type: Date },
    interviewSchedule: { type: Date },
    isActive: { type: Boolean, default: true },
    
    // Sensitive Fields
    salary: { type: Number },
    salarySlips: [{
      filename: String,
      path: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    leaves: { type: Number, default: 0 },
    
    // PII (Personal Identifiable Information)
    contactNumber: { type: String, trim: true },
    address: { type: String, trim: true },

    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", ContactSchema);
