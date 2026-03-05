const mongoose = require("mongoose");

const otpSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    hashedOtp: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["PASSWORD_CHANGE", "SECURITY_CHECK", "FORGOT_PASSWORD"],
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
    }
}, { timestamps: true });

// Compound index for rolling window queries and targeting specific active sessions
otpSessionSchema.index({ userId: 1, type: 1, createdAt: -1 });

// TTL Index to automatically remove expired OTP documents from database
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OtpSession", otpSessionSchema);
