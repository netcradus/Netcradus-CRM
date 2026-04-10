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
    salarySlips: [{
      filename: String,
      path: String,
      uploadedAt: { type: Date, default: Date.now },
      month: { type: String, trim: true },
      year: { type: Number },
      payDate: { type: Date },
      basicSalary: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      grossPay: { type: Number, default: 0 },
      netPay: { type: Number, default: 0 },
      notes: { type: String, trim: true },
      generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    }],
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
