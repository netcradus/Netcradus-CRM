const rateLimit = require("express-rate-limit");

// Prevent spamming the overarching login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Mins
    max: 10, // Max 10 attempts per IP
    message: {
        message: "Too many login attempts from this IP, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for requesting OTPs to prevent email flooding
const otpRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 Hour
    max: 10, // Max 10 attempts per IP
    message: {
        message: "Too many OTP requests from this IP, please try again after 1 hour."
    }
});

module.exports = {
    loginLimiter,
    otpRequestLimiter
};
