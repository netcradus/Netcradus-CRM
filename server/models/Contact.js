// models/Contact.js
const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
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
    leaves: { type: Number, default: 0 },
    
    // PII (Personal Identifiable Information)
    contactNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactNumber: { type: String, trim: true },
    personalEmail: { type: String, trim: true, lowercase: true },

    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", ContactSchema);
