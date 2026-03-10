const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const OtpSession = require("../models/OtpSession");
const User = require("../models/User");
const { logAuthEvent } = require("./securityService");

const MAX_OTP_REQUESTS_PER_HOUR = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const getTransporter = () => {
    // Determine configuration based on environment or service
    if (process.env.SMTP_SERVICE === 'gmail' || !process.env.SMTP_SERVICE) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    // Default to explicit STARTTLS on port 587 which is more reliable than 465 on cloud providers
    return nodemailer.createTransport({
        host: process.env.SMTP_SERVICE === 'brevo' ? 'smtp-relay.brevo.com' : 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
};

const generateAndSendOTP = async (userId, userEmail, type, ipAddress, userAgent) => {
    // 1. Check Rolling Window Limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentRequests = await OtpSession.countDocuments({
        userId,
        createdAt: { $gte: oneHourAgo }
    });

    if (recentRequests >= MAX_OTP_REQUESTS_PER_HOUR) {
        // Lock Account
        await User.findByIdAndUpdate(userId, {
            accountLockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS)
        });

        await logAuthEvent(userId, "LOGIN_LOCKED", ipAddress, userAgent, "Exceeded max OTP requests per hour");
        throw new Error("ACCOUNT_LOCKED_TOO_MANY_REQUESTS");
    }

    // For admin device verification, limit to 5 per hour
    if (type === "ADMIN_DEVICE_VERIFY") {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentAdminOtps = await OtpSession.countDocuments({
            userId,
            type: "ADMIN_DEVICE_VERIFY",
            createdAt: { $gt: oneHourAgo }
        });
        if (recentAdminOtps >= 5) {
            throw new Error("ADMIN_OTP_RATE_LIMIT");
        }
    }

    // 2. Cleanup old sessions
    await OtpSession.deleteMany({ userId, type });

    // 3. Generate OTP
    const plainOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(plainOtp, 10);

    // 4. Save Session (Admin Device Verify is 5 mins, others 10 mins)
    const expiryMins = type === "ADMIN_DEVICE_VERIFY" ? 5 : 10;
    const session = new OtpSession({
        userId,
        type,
        hashedOtp,
        expiresAt: new Date(Date.now() + expiryMins * 60 * 1000),
    });
    await session.save();

    // 5. Send via SMTP or API - ALL OTPs go to Admin for security
    const targetEmail = process.env.SMTP_MAIL;
    const subject = getEmailSubject(type, userEmail);
    const { text, html } = getEmailTemplate(type, userEmail, plainOtp, ipAddress);

    try {
        // Preference: Use Brevo API if key is present (most reliable for Render)
        if (process.env.BREVO_API_KEY) {
            await sendViaBrevoAPI(targetEmail, subject, text, html);
            return;
        }

        // Fallback: SMTP (works on localhost)
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_MAIL,
            to: targetEmail,
            subject,
            text,
            html
        });
    } catch (error) {
        console.error("CRITICAL EMAIL FAILURE:", error);
        await session.deleteOne();
        await logAuthEvent(userId, "EMAIL_FAILURE", ipAddress, userAgent, error.message);
        throw new Error("EMAIL_SERVICE_FAILURE");
    }
};

const getEmailSubject = (type, userEmail) => {
    let reason = "Security Verification";
    if (type === "PASSWORD_CHANGE") reason = "Forced Password Change";
    if (type === "SECURITY_CHECK") reason = "Weekly Verification";
    if (type === "FORGOT_PASSWORD") reason = "Forgot Password Reset";
    if (type === "ADMIN_DEVICE_VERIFY") reason = "New Admin Device Verification";

    return `[OTP ALERT] ${reason} - User: ${userEmail}`;
};

const getEmailTemplate = (type, userEmail, plainOtp, ipAddress) => {
    let reasonText = "General Security Check";
    if (type === "PASSWORD_CHANGE") reasonText = "Forced Password Change (30-day policy)";
    else if (type === "SECURITY_CHECK") reasonText = "Weekly Security Verification";
    else if (type === "FORGOT_PASSWORD") reasonText = "Forgot Password Reset Request";
    else if (type === "ADMIN_DEVICE_VERIFY") reasonText = "New Admin Device Login Verification";

    const timestamp = new Date().toLocaleString();
    const actionText = `User <strong>${userEmail}</strong> has requested a verification code for: <strong>${reasonText}</strong>.`;

    const text = `SECURITY NOTIFICATION\n\nUser: ${userEmail}\nReason: ${reasonText}\nRequested from IP: ${ipAddress}\nTime: ${timestamp}\n\nYour security verification code is: ${plainOtp}\n\nExpires in: ${type === "ADMIN_DEVICE_VERIFY" ? '5' : '10'} minutes.\nDO NOT share this code unless verified.`;

    const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 500px; border-radius: 8px;">
          <h2 style="color: #ff4b2b; margin-top: 0;">Netcradus CRM Admin Alert</h2>
          <p style="font-size: 16px;">${actionText}</p>
          
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; margin: 20px 0;">
             <p style="margin: 0; color: #666; font-size: 11px; text-transform: uppercase;">Verification Code</p>
             <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #333; margin: 10px 0;">
                ${plainOtp}
             </div>
          </div>

          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #666; width: 100px;"><strong>User:</strong></td>
              <td style="padding: 5px 0;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;"><strong>Reason:</strong></td>
              <td style="padding: 5px 0;">${reasonText}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;"><strong>IP Address:</strong></td>
              <td style="padding: 5px 0;"><code>${ipAddress}</code></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 5px 0;">${timestamp}</td>
            </tr>
          </table>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">This is a mandatory security notification sent ONLY to the administrator. The user does not receive this code directly.</p>
        </div>
      `;
    return { text, html };
};

const sendViaBrevoAPI = async (to, subject, textContent, htmlContent) => {
    const axios = require("axios");
    const data = {
        sender: { name: "Netcradus CRM", email: process.env.SMTP_MAIL },
        to: [{ email: to }],
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent
    };

    await axios.post("https://api.brevo.com/v3/smtp/email", data, {
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
        }
    });
    console.log(`[DEBUG] Email sent via Brevo API to ${to}`);
};

const verifyOTP = async (userId, type, plainOtp, ipAddress, userAgent) => {
    // Find active session
    const session = await OtpSession.findOne({
        userId,
        type,
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }); // Get latest

    if (!session) {
        throw new Error("EXPIRED_OR_NOT_FOUND");
    }

    // Compare hash
    const isMatch = await bcrypt.compare(plainOtp, session.hashedOtp);

    if (!isMatch) {
        // Increase attempts
        session.attempts += 1;
        if (session.attempts >= 3) {
            await session.deleteOne();
            await logAuthEvent(userId, "FAILED_OTP", ipAddress, userAgent, "Max 3 incorrect OTP attempts reached");
            throw new Error("MAX_ATTEMPTS_REACHED");
        }

        await session.save();
        throw new Error("INVALID_OTP");
    }

    // Success
    await session.deleteOne();
    await logAuthEvent(userId, "SECURITY_OTP_VERIFIED", ipAddress, userAgent);
    return true;
};

const cleanupOrphanedOTPs = async (userId) => {
    await OtpSession.deleteMany({ userId });
};

module.exports = {
    generateAndSendOTP,
    verifyOTP,
    cleanupOrphanedOTPs
};
