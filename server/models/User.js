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
    enum: ["admin", "sales", "support", "hr", "it", "digital_media"],
    default: "sales"
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