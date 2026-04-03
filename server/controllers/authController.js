const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AdminDevice = require("../models/AdminDevice");
const { UAParser } = require("ua-parser-js");
const {
  logAuthEvent,
  generateDeviceFingerprint,
  getIpGeoLocation,
  calculateDistance
} = require("../services/securityService");

// Create user (admin only)
const createUserByAdmin = async (req, res) => {
  try {
    const { email, password, role, department: manualDept, name } = req.body;

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

    // Extract first name from email or use provided name
    const firstName = name || normalizedEmail.split("@")[0].split(".")[0];

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
      role: role.toLowerCase(),
      department: manualDept || department,
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

    if (user) {
    } else {
      console.log(`[DEBUG] User not found for: ${identifier}`);
    }

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
      if (user && user.role?.trim().toLowerCase() !== 'admin') {
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
    if (user.role?.trim().toLowerCase() !== 'admin') {
      user.failedLoginAttempts = 0;
      user.lastFailedLogin = null;
      await user.save();
    }

    // 2. Check Lock
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      return res.status(403).json({ message: `Account locked until ${user.accountLockedUntil.toLocaleTimeString()}` });
    }

    // 2.5 Admin Device Security Check
    if (user.role?.trim().toLowerCase() === "admin") {
      const { fingerprintData } = req.body; // { platform, timezone, screenResolution }
      if (!fingerprintData) {
        return res.status(400).json({ message: "Security fingerprint data required" });
      }

      const deviceId = generateDeviceFingerprint(
        userAgent,
        fingerprintData.platform,
        fingerprintData.timezone,
        fingerprintData.screenResolution
      );

      const parser = new UAParser(userAgent);
      const os = parser.getOS();
      const browser = parser.getBrowser();
      const deviceName = `${browser.name || 'Unknown Browser'} on ${os.name || 'Unknown OS'}`;

      let device = await AdminDevice.findOne({ userId: user._id, deviceId });

      // Check for Impossible Travel
      const currentGeo = await getIpGeoLocation(ipAddress);
      if (currentGeo && device && device.lastLoginLat && device.lastLoginLong) {
        const distance = calculateDistance(device.lastLoginLat, device.lastLoginLong, currentGeo.lat, currentGeo.lon);
        const timeDiffHours = (Date.now() - device.lastUsedAt.getTime()) / (1000 * 60 * 60);

        // Alarming: > 1000km in under 1 hour (as specified in refined requirements)
        if (distance > 1000 && timeDiffHours < 1) {
          await logAuthEvent(user._id, "IMPOSSIBLE_TRAVEL_DETECTED", ipAddress, userAgent, `Travelled ${Math.round(distance)}km in ${Math.round(timeDiffHours * 60)} mins`);
          await logAuthEvent(user._id, "ADMIN_RISK_LOGIN_DETECTED", ipAddress, userAgent, "Risk: Impossible Travel");

          // OTP Flooding Protection: Max 3 active device verification sessions
          const activeSessions = await require("../models/OtpSession").countDocuments({
            userId: user._id,
            type: "ADMIN_DEVICE_VERIFY",
            expiresAt: { $gt: new Date() }
          });
          if (activeSessions >= 3) {
            return res.status(403).json({ message: "Too many active verification attempts. Please wait." });
          }

          await require('../services/otpService').generateAndSendOTP(user._id, user.email, "ADMIN_DEVICE_VERIFY", ipAddress, userAgent);
          return res.status(403).json({
            action: "REQUIRE_ADMIN_DEVICE_VERIFICATION",
            userId: user._id,
            deviceId,
            message: "Suspicious travel detected. Please verify your identity with OTP."
          });
        }
      }

      if (!device) {
        // New Device Detection
        const verifiedCount = await AdminDevice.countDocuments({ userId: user._id, trusted: true });
        if (verifiedCount >= 3) {
          await logAuthEvent(user._id, "ADMIN_DEVICE_LIMIT_REACHED", ipAddress, userAgent);
          await logAuthEvent(user._id, "ADMIN_RISK_LOGIN_DETECTED", ipAddress, userAgent, "Risk: Device Limit Reached");
          return res.status(403).json({
            action: "DEVICE_LIMIT_REACHED",
            message: "Maximum of 3 admin devices allowed. Please revoke an existing device to continue."
          });
        }

        device = new AdminDevice({
          userId: user._id,
          deviceId,
          userAgent,
          deviceName,
          firstLoginIp: ipAddress,
          lastLoginIp: ipAddress,
          lastLoginLat: currentGeo?.lat,
          lastLoginLong: currentGeo?.lon,
          lastCity: currentGeo?.city || currentGeo?.country,
          lastCountry: currentGeo?.country,
          trusted: false
        });
        await device.save();
        await logAuthEvent(user._id, "ADMIN_NEW_DEVICE_DETECTED", ipAddress, userAgent);
        await logAuthEvent(user._id, "ADMIN_RISK_LOGIN_DETECTED", ipAddress, userAgent, "Risk: New Device");
      } else {
        // Auto-expire check: > 60 days
        const daysInactive = (Date.now() - device.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysInactive > 60) {
          device.trusted = false;
          await device.save();
          await logAuthEvent(user._id, "DEVICE_AUTO_EXPIRED", ipAddress, userAgent);
        }
      }

      if (!device.trusted) {
        // OTP Flooding Protection
        const activeSessions = await require("../models/OtpSession").countDocuments({
          userId: user._id,
          type: "ADMIN_DEVICE_VERIFY",
          expiresAt: { $gt: new Date() }
        });
        if (activeSessions >= 3) {
          return res.status(403).json({ message: "Too many active verification attempts. Please wait." });
        }

        await require('../services/otpService').generateAndSendOTP(user._id, user.email, "ADMIN_DEVICE_VERIFY", ipAddress, userAgent);
        return res.status(403).json({
          action: "REQUIRE_ADMIN_DEVICE_VERIFICATION",
          userId: user._id,
          deviceId,
          message: "New or untrusted device detected. Please verify with OTP sent to admin email."
        });
      }

      // Update stable device info
      device.lastLoginIp = ipAddress;
      device.lastUsedAt = new Date();
      if (currentGeo) {
        device.lastLoginLat = currentGeo.lat;
        device.lastLoginLong = currentGeo.lon;
        device.lastCity = currentGeo.city || currentGeo.country;
        device.lastCountry = currentGeo.country;
      }
      await device.save();
    }

    let passwordExpiryWarning = false;

    // 3. Priority Checks for non-admin
    const roleForCheck = user.role?.trim().toLowerCase();
    const isActuallyAdmin = roleForCheck === "admin";

    if (!isActuallyAdmin) {
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
    // Reset security timers so the user isn't immediately prompted on login
    user.lastPasswordChange = new Date();
    user.lastWeeklyVerification = new Date();
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = null;
    
    await user.save();

    res.json({
      message: `Password updated for ${user.name}`
    });

  } catch (err) {
    console.error("Admin Change Password Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update user general info (admin only)
const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Cannot update primary admin" });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (role && role !== "admin") user.role = role.toLowerCase();
    if (department) user.department = department;

    await user.save();

    res.json({
      message: `User ${user.name} updated successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (err) {
    console.error("Update User Error:", err);
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

const verifyAdminDevice = async (req, res) => {
  try {
    const { userId, deviceId, otp } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const user = await User.findById(userId);
    if (!user || user.role?.trim().toLowerCase() !== "admin") return res.status(403).json({ message: "Unauthorized" });

    // Verify OTP (Strict 5 min expiry handled in service)
    await require('../services/otpService').verifyOTP(userId, "ADMIN_DEVICE_VERIFY", otp, ipAddress, userAgent);

    // Trust device
    const device = await AdminDevice.findOne({ userId, deviceId });
    if (device) {
      device.trusted = true;
      device.lastUsedAt = new Date();
      await device.save();
      await logAuthEvent(userId, "ADMIN_DEVICE_VERIFIED", ipAddress, userAgent);
    }

    // Success - Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
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
    res.status(500).json({ message: "Server error" });
  }
};

const getAdminDevices = async (req, res) => {
  try {
    const devices = await AdminDevice.find({ userId: req.user.id }).sort({ lastUsedAt: -1 });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const revokeAdminDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    await AdminDevice.deleteOne({ userId: req.user.id, deviceId });
    await logAuthEvent(req.user.id, "DEVICE_REVOKED", req.ip, req.get('User-Agent'), `Revoked ${deviceId}`);
    res.json({ message: "Device revoked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
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
  updateUserByAdmin,
  requestOTP,
  verifySecurityOTP,
  verifyPasswordChange,
  verifyAdminDevice,
  getAdminDevices,
  revokeAdminDevice
};
