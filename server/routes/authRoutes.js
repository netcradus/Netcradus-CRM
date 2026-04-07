const express = require("express");
const router = express.Router();
const {
    createUserByAdmin,
    login,
    getUsers,
    deleteUserByAdmin,
    adminChangeUserPassword,
    requestOTP,
    verifySecurityOTP,
    verifyPasswordChange,
    requestForgotPasswordOTP,
    resetPasswordWithOTP,
    getAdminDevices,
    revokeAdminDevice,
    updateUserByAdmin,
    verifyPasswordForReAuth,
    checkReAuthToken
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { loginLimiter, otpRequestLimiter } = require("../middleware/rateLimiter");

// Login Route + Limiter
router.post("/login", loginLimiter, login);

// Admin Device Verification (Unauthenticated but linked to userId)
router.post("/otp/verify-admin-device", loginLimiter, verifyAdminDevice);

// OTP Routes + Limiter
router.post("/otp/request", otpRequestLimiter, requestOTP);
router.post("/otp/verify-security", loginLimiter, verifySecurityOTP);
router.post("/otp/verify-password", loginLimiter, verifyPasswordChange);
router.post("/password/forgot-request", otpRequestLimiter, requestForgotPasswordOTP);
router.post("/password/forgot-reset", loginLimiter, resetPasswordWithOTP);

// NEW Re-authentication gate for sensitive fields
router.post("/verify-password-reauth", authMiddleware, verifyPasswordForReAuth);

// Admin device management
router.get("/admin/devices", authMiddleware, adminMiddleware, getAdminDevices);
router.delete("/admin/devices/:deviceId", authMiddleware, adminMiddleware, revokeAdminDevice);

// Admin-only user management
router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.post("/users", authMiddleware, adminMiddleware, createUserByAdmin);
router.delete("/users/:id", authMiddleware, adminMiddleware, deleteUserByAdmin);
router.put("/users/:id/password", authMiddleware, adminMiddleware, adminChangeUserPassword);
router.patch("/users/:id", authMiddleware, adminMiddleware, updateUserByAdmin);


module.exports = router;




