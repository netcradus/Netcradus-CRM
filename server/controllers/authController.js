
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Create user (admin only)
const createUserByAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required"
      });
    }

    if (role.toLowerCase() === "admin") {
      return res.status(403).json({
        message: "Creation of additional admin users is forbidden"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    // Extract first name from email
    const firstName = normalizedEmail.split("@")[0].split(".")[0];

    // Department prefix
    const department = role.toLowerCase().replace("_", "");

    // Count existing users in same department
    const count = await User.countDocuments({ role });

    // Generate sequential number (001, 002, 003...)
    const number = String(count + 1).padStart(3, "0");

    const uniqueId = `${department}_${firstName}_${number}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      userId: uniqueId,
      name: firstName,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Login User
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = String(email || username || "").trim();
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!identifier || !password) {
      return res.status(400).json({ message: "Username/email and password are required" });
    }

    // Check if user exists by email or username
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { name: identifier }],
    });

    let isMatch = false;

    if (!user) {
      // 0. Timing Attack Mitigation
      // Run a dummy bcrypt compare against a realistic hash to consume standard compute time
      const dummyHash = "$2a$10$x.XpK8x2S3zX8xXpK8x2S3zX8xXpK8x2S3zX8xXpK8x2S3zX8xXpK";
      await bcrypt.compare(password, dummyHash);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!user || !isMatch) {
      if (user && user.role !== 'admin') {
        const now = new Date();
        const failWindow = 30 * 60 * 1000; // 30 mins

        // Check if previous fail was long ago, reset if so
        if (user.lastFailedLogin && (now - user.lastFailedLogin) > failWindow) {
          user.failedLoginAttempts = 1;
        } else {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        }
        user.lastFailedLogin = now;
        await user.save();

        await require('../services/securityService').logAuthEvent(user._id, "LOGIN_FAILED", ipAddress, userAgent, `Attempt ${user.failedLoginAttempts}`);

        if (user.failedLoginAttempts >= 3) {
          return res.status(400).json({
            message: "Invalid credentials",
            action: "SHOW_FORGOT_PASSWORD_LINK"
          });
        }
      }
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // On Success: Reset tracker
    if (user.role !== 'admin') {
      user.failedLoginAttempts = 0;
      user.lastFailedLogin = null;
      await user.save();
    }

    // 2. Check Lock
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      return res.status(403).json({ message: `Account locked until ${user.accountLockedUntil.toLocaleTimeString()}` });
    }

    let passwordExpiryWarning = false;

    // 3. Priority Checks for non-admin
    if (user.role !== "admin") {
      const now = Date.now();
      const msPerDay = 1000 * 60 * 60 * 24;

      const daysSincePasswordChange = (now - user.lastPasswordChange.getTime()) / msPerDay;
      const daysSinceWeeklyAuth = (now - user.lastWeeklyVerification.getTime()) / msPerDay;

      // A. Password Expiry Policy (Priority 1)
      if (daysSincePasswordChange >= 30) {
        // Force password change immediately
        await require('../services/otpService').generateAndSendOTP(user._id, user.email, "PASSWORD_CHANGE", ipAddress, userAgent);
        return res.status(403).json({
          action: "FORCE_PASSWORD_CHANGE",
          userId: user._id,
          message: "You must change your password. An OTP has been sent to your IT Administrator."
        });
      }

      // B. Weekly OTP Policy (Priority 2)
      if (daysSinceWeeklyAuth >= 7) {
        await require('../services/otpService').generateAndSendOTP(user._id, user.email, "SECURITY_CHECK", ipAddress, userAgent);
        return res.status(403).json({
          action: "REQUIRE_SECURITY_OTP",
          userId: user._id,
          message: "Weekly security verification required. An OTP has been sent to your IT Administrator."
        });
      }

      // C. Password Expiry Warning
      if (daysSincePasswordChange >= 25) {
        passwordExpiryWarning = true;
      }
    }

    // If all checks pass, Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      token,
      passwordExpiryWarning,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    if (err.message === "ACCOUNT_LOCKED_TOO_MANY_REQUESTS" || err.message === "SMTP_FAILURE") {
      return res.status(500).json({ message: "Security threshold reached or mail service error. Please try again later.", error: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Request Forgot Password OTP
const requestForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Enumeration Protection: If user doesn't exist, still return 200 to not leak existence
    // BUT we don't send email.
    if (!user) {
      return res.status(200).json({ message: "If an account exists, an OTP has been sent." });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: "Admin password reset must be handled by system administrator via CLI." });
    }

    await require('../services/otpService').generateAndSendOTP(user._id, user.email, "FORGOT_PASSWORD", ipAddress, userAgent);

    res.status(200).json({
      message: "If an account exists, an OTP has been sent.",
      userId: user._id
    });
  } catch (err) {
    console.error("Forgot Password OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password with OTP
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP
    await require('../services/otpService').verifyOTP(user._id, "FORGOT_PASSWORD", otp, ipAddress, userAgent);

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.lastPasswordChange = new Date();

    // Reset failed login tracking
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = null;

    await user.save();

    res.status(200).json({ message: "Password updated successfully. You can now login." });
  } catch (err) {
    console.error("Reset Password OTP Error:", err);
    if (err.message === "EXPIRED_OR_NOT_FOUND" || err.message === "INVALID_OTP" || err.message === "MAX_ATTEMPTS_REACHED") {
      return res.status(400).json({ message: "Invalid or expired OTP", error: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (for admin to assign leads)
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id userId name email role createdAt");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (admin only)
const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin users cannot be deleted" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// Admin change password of created user
const adminChangeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();

    res.json({
      message: `Password updated for ${user.name}`
    });

  } catch (err) {
    console.error("Admin Change Password Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const requestOTP = async (req, res) => {
  try {
    const { userId, type } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await require('../services/otpService').generateAndSendOTP(userId, user.email, type, ipAddress, userAgent);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    if (err.message === "ACCOUNT_LOCKED_TOO_MANY_REQUESTS" || err.message === "SMTP_FAILURE") {
      return res.status(500).json({ message: "Security threshold reached or mail service error.", error: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const verifySecurityOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify OTP
    await require('../services/otpService').verifyOTP(userId, "SECURITY_CHECK", otp, ipAddress, userAgent);

    // Reset weekly verification
    user.lastWeeklyVerification = Date.now();
    await user.save();

    // Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.message === "EXPIRED_OR_NOT_FOUND" || err.message === "INVALID_OTP" || err.message === "MAX_ATTEMPTS_REACHED") {
      return res.status(400).json({ message: "Invalid or expired OTP", error: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const verifyPasswordChange = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Password Policy Check
    const strengthCheck = require('../services/passwordPolicyService').validateStrength(newPassword);
    if (!strengthCheck.valid) {
      return res.status(400).json({ message: strengthCheck.message });
    }

    const historyCheck = await require('../services/passwordPolicyService').checkHistory(userId, newPassword);
    if (!historyCheck.valid) {
      return res.status(400).json({ message: historyCheck.message });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify OTP
    await require('../services/otpService').verifyOTP(userId, "PASSWORD_CHANGE", otp, ipAddress, userAgent);

    // Update Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.lastPasswordChange = Date.now();
    user.lastWeeklyVerification = Date.now();

    // Keep only last 3 passwords
    user.previousPasswords.unshift(hashedPassword);
    if (user.previousPasswords.length > 3) {
      user.previousPasswords.pop();
    }

    await user.save();

    // Log success
    await require('../services/securityService').logAuthEvent(userId, "PASSWORD_CHANGED", ipAddress, userAgent);

    // Cleanup Any other active OTPs
    await require('../services/otpService').cleanupOrphanedOTPs(userId);

    // Issue new Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Password changed successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    if (err.message === "EXPIRED_OR_NOT_FOUND" || err.message === "INVALID_OTP" || err.message === "MAX_ATTEMPTS_REACHED") {
      return res.status(400).json({ message: "Invalid or expired OTP", error: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createUserByAdmin,
  login,
  requestForgotPasswordOTP,
  resetPasswordWithOTP,
  getUsers,
  deleteUserByAdmin,
  adminChangeUserPassword,
  requestOTP,
  verifySecurityOTP,
  verifyPasswordChange
};
