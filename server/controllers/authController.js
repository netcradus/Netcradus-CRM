const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Contact = require("../models/Contact");
const storageService = require("../services/storageService");
const AdminDevice = require("../models/AdminDevice");
const { UAParser } = require("ua-parser-js");
const {
  logAuthEvent,
  generateDeviceFingerprint,
  getIpGeoLocation,
  calculateDistance
} = require("../services/securityService");
const AuditLog = require("../models/AuditLog");

// In-memory re-authentication tokens (5-min TTL)
const reAuthTokens = new Map();

// Helper to purge expired re-auth tokens
const purgeExpiredTokens = () => {
  const now = Date.now();
  for (const [userId, data] of reAuthTokens.entries()) {
    if (data.expiresAt < now) {
      reAuthTokens.delete(userId);
    }
  }
};

// Create user (super user only)
const createUserByAdmin = async (req, res) => {
  try {
    const { email, password, role, department: manualDept, name } = req.body;
    const normalizedRole = String(role || "").trim().toLowerCase();
    const allowedRoles = ["admin", "management", "sales", "support", "it", "hr", "digital_media"];

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required"
      });
    }

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid role selected"
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
    const department = normalizedRole.replace("_", "");

    // Count existing users in same department
    const count = await User.countDocuments({ role: normalizedRole });

    // Generate sequential number (001, 002, 003...)
    const number = String(count + 1).padStart(3, "0");

    const uniqueId = `${department}_${firstName}_${number}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      userId: uniqueId,
      name: firstName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      department: manualDept || department,
    });

    await user.save();

    await Contact.findOneAndUpdate(
      { linkedUser: user._id },
      {
        $setOnInsert: {
          linkedUser: user._id,
          name: user.name,
          email: user.email,
          status: "Employee",
          department: user.department || "General",
          designation: formatRoleLabel(user.role || "employee"),
          joiningDate: user.createdAt,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Provision Google Drive storage for the new user ──────────────────────
    try {
      await storageService.provisionUserStorage(user._id, user.name || firstName, user.role);
      user.storageProvisioned = true;
      await user.save();
    } catch (storageErr) {
      // Do NOT block user creation if Drive provisioning fails.
      // storageProvisioned stays false — retryable from the admin panel.
      console.error(`[AuthController] Drive provisioning failed for user ${user._id}:`, storageErr.message);
    }

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

    if (user.isDisabled) {
      return res.status(403).json({
        message: "You can't login. Contact the Administrator."
      });
    }

    // 2. Lock & Compliance Check
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      return res.status(403).json({ message: `Account locked until ${user.accountLockedUntil.toLocaleTimeString()}` });
    }

    const role = user.role?.trim().toLowerCase();

    // 3. SUPER_USER Security Gate (Legacy Admin Protections)
    if (role === "super_user") {
      const { fingerprintData } = req.body;
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

      // Impossible Travel Check
      const currentGeo = await getIpGeoLocation(ipAddress);
      if (currentGeo && device && device.lastLoginLat && device.lastLoginLong) {
        const distance = calculateDistance(device.lastLoginLat, device.lastLoginLong, currentGeo.lat, currentGeo.lon);
        const timeDiffHours = (Date.now() - device.lastUsedAt.getTime()) / (1000 * 60 * 60);

        if (distance > 1000 && timeDiffHours < 1) {
          await AuditLog.create({ action: "IMPOSSIBLE_TRAVEL_DETECTED", performedBy: user._id, ipAddress, userAgent, details: { distance, timeDiffHours } });
          await require('../services/otpService').generateAndSendOTP(user._id, user.email, "ADMIN_DEVICE_VERIFY", ipAddress, userAgent);
          return res.status(403).json({
            action: "REQUIRE_ADMIN_DEVICE_VERIFICATION",
            userId: user._id,
            deviceId,
            message: "Suspicious travel detected. Please verify your identity with OTP."
          });
        }
      }

      // Device Limit (Max 3)
      if (!device) {
        const verifiedCount = await AdminDevice.countDocuments({ userId: user._id, trusted: true });
        if (verifiedCount >= 3) {
          await AuditLog.create({ action: "SUPER_USER_DEVICE_LIMIT_REACHED", performedBy: user._id, ipAddress, userAgent });
          return res.status(403).json({
            action: "DEVICE_LIMIT_REACHED",
            message: "Maximum of 3 super_user devices allowed."
          });
        }

        device = new AdminDevice({
          userId: user._id, deviceId, userAgent, deviceName,
          firstLoginIp: ipAddress, lastLoginIp: ipAddress,
          lastLoginLat: currentGeo?.lat, lastLoginLong: currentGeo?.lon,
          lastCity: currentGeo?.city || currentGeo?.country, lastCountry: currentGeo?.country,
          trusted: false
        });
        await device.save();
        await AuditLog.create({ action: "SUPER_USER_NEW_DEVICE_DETECTED", performedBy: user._id, ipAddress, userAgent });
      }

      if (!device.trusted) {
        await require('../services/otpService').generateAndSendOTP(user._id, user.email, "ADMIN_DEVICE_VERIFY", ipAddress, userAgent);
        return res.status(403).json({
          action: "REQUIRE_ADMIN_DEVICE_VERIFICATION",
          userId: user._id,
          deviceId,
          message: "New or untrusted device. Please verify with OTP sent to IT admin email."
        });
      }

      device.lastLoginIp = ipAddress;
      device.lastUsedAt = new Date();
      if (currentGeo) {
        device.lastLoginLat = currentGeo.lat; device.lastLoginLong = currentGeo.lon;
        device.lastCity = currentGeo.city; device.lastCountry = currentGeo.country;
      }
      await device.save();
    }

    // 4. ADMIN & MANAGEMENT Compliance Gate (Weekly OTP, Password Expiry)
    let passwordExpiryWarning = false;
    if (role === "admin" || role === "management") {
      const now = Date.now();
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysSincePass = (now - user.lastPasswordChange.getTime()) / msPerDay;
      const daysSinceWeekly = (now - user.lastWeeklyVerification.getTime()) / msPerDay;

      if (daysSincePass >= 30) {
        await require('../services/otpService').generateAndSendOTP(user._id, user.email, "PASSWORD_CHANGE", ipAddress, userAgent);
        return res.status(403).json({ action: "FORCE_PASSWORD_CHANGE", userId: user._id, message: "30-day password change required. OTP sent to IT admin." });
      }

      if (daysSinceWeekly >= 7) {
        await require('../services/otpService').generateAndSendOTP(user._id, user.email, "SECURITY_CHECK", ipAddress, userAgent);
        return res.status(403).json({ action: "REQUIRE_SECURITY_OTP", userId: user._id, message: "Weekly verification required. OTP sent to IT admin." });
      }

      if (daysSincePass >= 25) passwordExpiryWarning = true;
    }

    // Success - Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({
      token, passwordExpiryWarning,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Verify Password for Sensitive Access (Re-auth)
const verifyPasswordForReAuth = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await AuditLog.create({ action: "REAUTH_FAILED", performedBy: userId, ipAddress: req.ip, userAgent: req.get('User-Agent') });
      return res.status(400).json({ message: "Invalid password" });
    }

    const reAuthToken = crypto.randomUUID();
    reAuthTokens.set(userId.toString(), {
      token: reAuthToken,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins
    });

    await AuditLog.create({ action: "REAUTH_SUCCESS", performedBy: userId, ipAddress: req.ip, userAgent: req.get('User-Agent') });
    res.json({ success: true, reAuthToken });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Check Re-auth Token Middleware
const checkReAuthToken = (req, res, next) => {
  const token = req.headers['x-reauth-token'];
  const userId = req.user.id.toString();

  purgeExpiredTokens();
  const stored = reAuthTokens.get(userId);

  if (!stored || stored.token !== token) {
    return res.status(403).json({ message: "Re-authentication required", triggerReAuth: true });
  }

  next();
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

// Get all users (for super user management and privileged assignment flows)
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id userId name email role createdAt isDisabled disabledAt disabledReason");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (super user only)
const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "super_user") {
      return res.status(403).json({ message: "Super User accounts cannot be deleted" });
    }

    await Contact.deleteOne({ linkedUser: user._id });
    await user.deleteOne();

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// Super user changes password of managed users
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
    console.error("Managed User Password Change Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update user general info (super user only)
const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "super_user" && req.user.role !== "super_user") {
      return res.status(403).json({ message: "Cannot update the primary Super User" });
    }

    const previousEmail = user.email;
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (role && role !== "super_user") user.role = role.toLowerCase();
    if (department) user.department = department;

    await user.save();

    await Contact.findOneAndUpdate(
      { $or: [{ linkedUser: user._id }, { email: previousEmail }] },
      {
        $set: {
          linkedUser: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          designation: formatRoleLabel(user.role || "employee"),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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

const toggleUserAccessByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDisabled, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "super_user") {
      return res.status(403).json({ message: "Super User accounts cannot be disabled" });
    }

    user.isDisabled = Boolean(isDisabled);
    user.disabledAt = user.isDisabled ? new Date() : null;
    user.disabledBy = user.isDisabled ? req.user._id : null;
    user.disabledReason = user.isDisabled ? String(reason || "").trim() : "";

    await user.save();

    res.json({
      message: user.isDisabled
        ? `${user.name} has been temporarily disabled`
        : `${user.name} has been re-enabled`,
      user: {
        id: user._id,
        isDisabled: user.isDisabled,
        disabledAt: user.disabledAt,
        disabledReason: user.disabledReason,
      }
    });
  } catch (err) {
    console.error("Toggle User Access Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const formatRoleLabel = (role = "") =>
  String(role || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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
    if (!user || user.role?.trim().toLowerCase() !== "super_user") return res.status(403).json({ message: "Unauthorized" });

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
  toggleUserAccessByAdmin,
  requestOTP,
  verifySecurityOTP,
  verifyPasswordChange,
  verifyAdminDevice,
  getAdminDevices,
  revokeAdminDevice,
  verifyPasswordForReAuth,
  checkReAuthToken
};
