const nodemailer = require("nodemailer");

const getTransporter = () => {
    // 1. If custom SMTP host is configured, prioritize it
    if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: port,
            secure: secure,
            auth: {
                user: process.env.SMTP_USER || process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false // Avoid self-signed certificate errors on localhost
            }
        });
    }

    if (process.env.SMTP_SERVICE === 'gmail' || !process.env.SMTP_SERVICE) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

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

const verifyTransporter = () => {
    // Only check if we are using SMTP fallback (not Brevo API)
    if (!process.env.BREVO_API_KEY) {
        try {
            const transporter = getTransporter();
            transporter.verify((error) => {
                if (error) {
                    console.error("SMTP connection failed:", error.message);
                } else {
                    console.log("SMTP server is ready");
                }
            });
        } catch (err) {
            console.error("Transporter instantiation failed:", err.message);
        }
    } else {
        console.log("SMTP connection verified (using Brevo API)");
    }
};

const sendPasswordResetEmail = async (toEmail, employeeName, resetToken) => {
    const clientUrl = process.env.CLIENT_URL || "https://netcradus.tech";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const subject = "Reset your Netcradus CRM password";

    const text = `Hello ${employeeName || "User"},\n\nWe received a request to reset your Netcradus CRM password.\n\nUse the link below to create a new password. This link will expire in 15 minutes.\n\n${resetUrl}\n\nIf you did not request this password reset, you can safely ignore this email.\n\nBest regards,\nNetcradus Team`;

    const html = `
        <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; max-width: 500px; border-radius: 12px; background-color: #ffffff; color: #1e293b; margin: 0 auto;">
          <h2 style="color: #ff4b2b; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Netcradus CRM</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello <strong>${employeeName || "User"}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">We received a request to reset your Netcradus CRM password.</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #ff4b2b; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 4px 6px rgba(255, 75, 43, 0.2);">
              Reset Password
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
            This link will expire in <strong>15 minutes</strong>. If you cannot click the button above, copy and paste this URL into your browser:
            <br />
            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all; font-family: monospace; font-size: 12px;">${resetUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 11px; line-height: 1.4; text-align: center;">
            If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
    `;

    try {
        if (process.env.BREVO_API_KEY) {
            const axios = require("axios");
            const data = {
                sender: { name: "Netcradus CRM", email: process.env.SMTP_MAIL },
                to: [{ email: toEmail }],
                subject: subject,
                textContent: text,
                htmlContent: html
            };
            await axios.post("https://api.brevo.com/v3/smtp/email", data, {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json"
                }
            });
            console.log(`Password reset email accepted (via Brevo API) for user: ${toEmail}`);
        } else {
            const transporter = getTransporter();
            const info = await transporter.sendMail({
                from: process.env.SMTP_MAIL,
                to: toEmail,
                subject,
                text,
                html
            });
            console.log("Password reset email accepted:", {
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected
            });
        }
    } catch (error) {
        console.error("Password reset email failed:", {
            message: error.message,
            code: error.code,
            command: error.command
        });
        throw error;
    }
};

module.exports = {
    verifyTransporter,
    sendPasswordResetEmail
};
