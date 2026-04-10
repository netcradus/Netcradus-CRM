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
      enum: ["super_user", "admin", "management", "sales", "support", "it", "hr", "digital_media"],
      default: "management",
      trim: true,
      lowercase: true
    },
  department: {
    type: String,
    trim: true,
    default: "General"
  },

  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  lastWeeklyVerification: {
    type: Date,
    default: Date.now
  },
  previousPasswords: {
    type: [String],
    default: []
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
  resetTokenExpiry: Date

}, { timestamps: true });

// Optional: if user is locked out, we can check virtual
userSchema.virtual('isLocked').get(function () {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

module.exports = mongoose.model("User", userSchema);
