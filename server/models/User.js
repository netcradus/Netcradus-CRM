const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    // Partner is a non-admin, non-employee role used only for vendor/project collaboration.
    enum: ["super_user", "admin", "management", "manager", "sales", "support", "it", "hr", "digital_media", "partner"],
    default: "management",
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    trim: true,
    default: "General"
  },
  designation: {
    type: String,
    trim: true,
    default: ""
  },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  lastWeeklyVerification: {
    type: Date,
    default: Date.now
  },
  accountLockedUntil: {
    type: Date
  },
  isDisabled: {
    type: Boolean,
    default: false
  },
  disabledAt: {
    type: Date
  },
  disabledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  disabledReason: {
    type: String,
    trim: true,
    default: ""
  },

  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: {
    type: Date
  },

  resetToken: String,
  resetTokenExpiry: Date,

  // Drive storage provisioning status
  storageProvisioned: {
    type: Boolean,
    default: false
  },
  zohoEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  zohoAccountId: {
    type: String,
    default: null
  },
  zohoConnected: {
    type: Boolean,
    default: false
  },
  zohoConnectedAt: {
    type: Date,
    default: null
  },
  skipOnboarding: {
    type: Boolean,
    default: false
  },
  emergencyContact: {
    name: String,
    relationship: String,
    contactNumber: String,
    alternateContactNumber: String,
    address: String,
    notes: String
  }

}, { timestamps: true });

userSchema.index({ name: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Optional: if user is locked out, we can check virtual
userSchema.virtual('isLocked').get(function () {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

module.exports = mongoose.model("User", userSchema);
