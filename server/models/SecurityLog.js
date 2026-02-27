const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // Not strictly required since some failures (e.g., locking via IP) might not map to a found user, 
        // although our current flow locks by user account.
    },
    action: {
        type: String,
        enum: [
            "PASSWORD_CHANGED",
            "SECURITY_OTP_VERIFIED",
            "FAILED_OTP",
            "LOGIN_LOCKED",
            "SMTP_FAILURE",
            "PASSWORD_RESET_REQUESTED",
            "LOGIN_ATTEMPT"
        ],
        required: true,
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    errorMessage: {
        type: String,
    }
}, { timestamps: true });

// Index for easier auditing by user
securityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SecurityLog", securityLogSchema);
