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

    // 2. Clear out any existing active OTP for this user and type (Race Condition Protection)
    await OtpSession.deleteMany({ userId, type });

    // 3. Generate new OTP
    const plainOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(plainOtp, 10);

    // 4. Save to DB (10 min expiry)
    const session = new OtpSession({
        userId,
        hashedOtp,
        type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
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
    if (type === "PASSWORD_CHANGE") return `Mandatory Password Change Verification Code for ${userEmail}`;
    if (type === "SECURITY_CHECK") return `Weekly Security Verification Code for ${userEmail}`;
    if (type === "FORGOT_PASSWORD") return "Password Reset Verification Code";
    return "Security Verification Code";
};

const getEmailTemplate = (type, userEmail, plainOtp, ipAddress) => {
    let actionText = "A verification code was requested for this account.";
    if (type === "PASSWORD_CHANGE") actionText = `User <strong>${userEmail}</strong> is trying to change their password.`;
    else if (type === "SECURITY_CHECK") actionText = `This OTP is for <strong>${userEmail}</strong> for their weekly security verification.`;
    else if (type === "FORGOT_PASSWORD") actionText = `A password reset was requested for your account (<strong>${userEmail}</strong>).`;

    const timestamp = new Date().toLocaleString();
    const text = `${actionText.replace(/<\/?[^>]+(>|$)/g, "")}\n\nYour security verification code is: ${plainOtp}\n\nExpires in: 10 minutes\nRequested from IP: ${ipAddress}\nTime: ${timestamp}\n\nDO NOT share this code with anyone.`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 500px; border-radius: 8px;">
          <h2 style="color: #ff4b2b;">Netcradus CRM Security</h2>
          <p>${actionText}</p>
          <div style="background: #f4f4f4; padding: 20px; font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 4px; border: 1px solid #eee;">
            ${plainOtp}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <strong>Expires in:</strong> 10 minutes<br>
            <strong>Requested from IP:</strong> ${ipAddress}<br>
            <strong>Time:</strong> ${timestamp}
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated security notification. If you did not request this, please contact your IT administrator immediately.</p>
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
