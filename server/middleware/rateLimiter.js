const rateLimit = require("express-rate-limit");

// ─── Login limiter ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 10,
    message: { message: "Too many login attempts from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── OTP request limiter ──────────────────────────────────────────────────────
const otpRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { message: "Too many OTP requests from this IP, please try again after 1 hour." },
});

// ─── Document upload limiter — 30 uploads per user per hour ───────────────────
const uploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
    validate: { keyGeneratorIpFallback: false },
    message: {
        success: false,
        message: "Upload limit reached (30 per hour). Please try again later.",
        code: "RATE_LIMIT_REACHED",
    },
});

// ─── View/Download limiter — 100 requests per user per hour ──────────────────
const viewDownloadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
    validate: { keyGeneratorIpFallback: false },
    message: {
        success: false,
        message: "View/download limit reached (100 per hour). Please try again later.",
        code: "RATE_LIMIT_REACHED",
    },
});

const verifyPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
    validate: { keyGeneratorIpFallback: false },
    message: {
        success: false,
        message: "Too many password attempts. Please try again after 15 minutes.",
        code: "TOO_MANY_ATTEMPTS",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const projectRouteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
    validate: { keyGeneratorIpFallback: false },
    message: {
        success: false,
        message: "Too many project requests. Please try again later.",
        code: "RATE_LIMIT_REACHED",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    otpRequestLimiter,
    uploadRateLimiter,
    viewDownloadRateLimiter,
    verifyPasswordLimiter,
    projectRouteLimiter,
};
