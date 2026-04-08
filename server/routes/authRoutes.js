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
    checkReAuthToken,
    verifyAdminDevice
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter, otpRequestLimiter } = require("../middleware/rateLimiter");

const superUserOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "super_user") {
        return res.status(403).json({ message: "Only super users can perform this action" });
    }

    next();
};

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
router.get("/admin/devices", authMiddleware, superUserOnly, getAdminDevices);
router.delete("/admin/devices/:deviceId", authMiddleware, superUserOnly, revokeAdminDevice);

// Admin-only user management
router.get("/users", authMiddleware, superUserOnly, getUsers);
router.post("/users", authMiddleware, superUserOnly, createUserByAdmin);
router.delete("/users/:id", authMiddleware, superUserOnly, deleteUserByAdmin);
router.put("/users/:id/password", authMiddleware, superUserOnly, adminChangeUserPassword);
router.patch("/users/:id", authMiddleware, superUserOnly, updateUserByAdmin);


module.exports = router;




