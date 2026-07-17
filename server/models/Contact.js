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
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      immutable: true
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
    employeeStatus: {
      type: String,
      enum: ["Active", "Notice Period", "Ex Employee", "Terminated", "Suspended", "On Leave"],
      default: "Active",
    },
    employmentType: {
      type: String,
      enum: [
        "Full Time",
        "Part Time",
        "Contract",
        "Consultant",
        "Paid Intern",
        "Unpaid Intern",
        "Trainee",
        "Probation",
      ],
      default: "Full Time",
    },
    probationEndDate: { type: Date, default: null },
    noticePeriodDays: { type: Number, min: 0, max: 365, default: 0 },
    offeredSalary: { type: Number, min: 0, default: null },
    aadhaarNumber: { type: String, default: "" },
    panNumber: { type: String, uppercase: true, default: "" },
    uanNumber: { type: String, default: "" },
    esicNumber: { type: String, default: "" },
    bankDetails: {
      paymentMode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      branchName: { type: String, default: "" },
      upiId: { type: String, default: "" },
      accountType: { type: String, default: "" }
    },


    // PII (Personal Identifiable Information)
    contactNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactNumber: { type: String, trim: true },
    personalEmail: { type: String, trim: true, lowercase: true },
    emergencyContact: {
      name: {
        type: String,
        required: [true, "Emergency contact name is required."],
        minlength: [2, "Emergency contact name must be at least 2 characters."],
        maxlength: [100, "Emergency contact name cannot exceed 100 characters."],
        trim: true
      },
      relationship: {
        type: String,
        required: [true, "Relationship is required."],
        enum: {
          values: ["Father", "Mother", "Brother", "Sister", "Spouse", "Friend", "Guardian", "Other"],
          message: "Invalid relationship."
        },
        trim: true
      },
      contactNumber: {
        type: String,
        required: [true, "Contact number is required."],
        validate: {
          validator: function (v) {
            return /^[0-9]{10}$/.test(v);
          },
          message: "Contact number must be exactly 10 digits."
        },
        trim: true
      },
      alternateContactNumber: {
        type: String,
        required: [true, "Alternate contact number is required."],
        validate: {
          validator: function (v) {
            return /^[0-9]{10}$/.test(v);
          },
          message: "Contact number must be exactly 10 digits."
        },
        trim: true
      },
      address: {
        type: String,
        required: [true, "Emergency address is required."],
        minlength: [10, "Emergency address must be at least 10 characters."],
        maxlength: [300, "Emergency address cannot exceed 300 characters."],
        trim: true
      },
      notes: {
        type: String,
        required: [true, "Notes are required."],
        minlength: [5, "Notes must be at least 5 characters."],
        maxlength: [500, "Notes cannot exceed 500 characters."],
        trim: true
      }
    },

    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", ContactSchema);
