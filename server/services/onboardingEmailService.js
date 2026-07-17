const axios = require("axios");
const { COMPANY } = require("../constants/onboardingContent");

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const TIMEZONE = "Asia/Kolkata";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: TIMEZONE,
    }).format(new Date(value))
    : "N/A";

const formatDateTime = (value) =>
  value
    ? `${new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TIMEZONE,
    }).format(new Date(value))} IST`
    : "N/A";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildLayout = (title, body) => `
  <div style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
      <div style="padding:16px 24px;background:${COMPANY.accentColor};color:#ffffff;font-size:20px;font-weight:700;">
        ${escapeHtml(title)}
      </div>
      <div style="padding:24px;">
        ${body}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;">
        ${escapeHtml(COMPANY.name)} | ${escapeHtml(COMPANY.website)} | ${escapeHtml(COMPANY.indiaOffice)}<br/>
        Confidential | ${escapeHtml(COMPANY.website)}
      </div>
    </div>
  </div>
`;

const detailRow = (label, value) => `
  <tr>
    <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#fafafa;font-weight:600;width:220px;">${escapeHtml(label)}</td>
    <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(value || "N/A")}</td>
  </tr>
`;

const hrTemplate = (record) =>
  buildLayout(
    "Netcradus HR Portal",
    `
      <p style="margin:0 0 16px;">A new employee has completed the onboarding process.</p>
      <h3 style="margin:24px 0 10px;font-size:16px;">Employee Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${detailRow("Full Name", record.agreementEmployeeName)}
        ${detailRow("Employee ID", record.employeeId)}
        ${detailRow("Role", record.agreementRole)}
        ${detailRow("Employment Type", record.agreementEmploymentType)}
        ${detailRow("Department", record.department)}
        ${detailRow("Date of Joining", formatDate(record.dateOfJoining))}
        ${detailRow("Official Email", record.officialEmail)}
        ${detailRow("Mobile", record.mobileNumber)}
        ${detailRow("Personal Email", record.personalEmail)}
      </table>
      <h3 style="margin:24px 0 10px;font-size:16px;">Verification Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${detailRow("Aadhaar Number", record.aadhaarNumber)}
        ${detailRow("Name on Aadhaar", record.nameOnAadhaar)}
        ${detailRow("Date of Birth", formatDate(record.dateOfBirth))}
        ${detailRow("Address", record.currentAddress)}
      </table>
      <h3 style="margin:24px 0 10px;font-size:16px;">Agreement Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${detailRow("Signed As", record.agreementSignature)}
        ${detailRow("Signed At", formatDateTime(record.agreementSignedAt))}
        ${detailRow("IP Address", record.agreementSignedIp)}
        ${detailRow("Agreement Version", record.agreementVersion)}
      </table>
      <p style="margin:18px 0 0;">Documents are attached to this email.</p>
    `
  );

const employeeTemplate = (record) =>
  buildLayout(
    "Netcradus Pvt. Ltd.",
    `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(record.agreementEmployeeName)},</p>
      <p style="margin:0 0 12px;">Your onboarding with ${escapeHtml(COMPANY.name)} is complete.</p>
      <p style="margin:0 0 16px;">A copy of your signed Employment Agreement and NDA is attached for your records. Please keep this safe.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${detailRow("Employee ID", record.employeeId)}
        ${detailRow("Role", record.agreementRole)}
        ${detailRow("Department", record.department)}
      </table>
      <p style="margin:16px 0 10px;">Agreement signed on ${escapeHtml(formatDate(record.agreementSignedAt))} at ${escapeHtml(formatDateTime(record.agreementSignedAt).split(" ").slice(1).join(" "))}.</p>
      <p style="margin:0;">For any queries, contact: ${escapeHtml(COMPANY.hrEmail)}</p>
    `
  );

const sendTransactionalEmail = async (payload) => {
  await axios.post(BREVO_URL, payload, {
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
};

const normalizeAttachments = (attachments = []) =>
  attachments
    .filter((item) => item?.name && item?.content)
    .map(({ name, content, type }) => ({
      name,
      content,
      type: type || "application/octet-stream",
    }));

const sendOnboardingEmails = async (onboardingRecord, hrAttachments = [], employeeAttachments = []) => {
  const record = onboardingRecord;
  const errors = [];

  if (!process.env.BREVO_API_KEY) {
    record.emailError = "BREVO_API_KEY is not configured.";
    await record.save();
    return;
  }

  const from = {
    email: process.env.ONBOARDING_FROM_EMAIL || "hr-noreply@netcradus.com",
    name: process.env.ONBOARDING_FROM_NAME || "Netcradus HR",
  };

  const hrEmail = process.env.HR_EMAIL || COMPANY.hrEmail;
  const normalizedHrAttachments = normalizeAttachments(hrAttachments);
  const normalizedEmployeeAttachments = normalizeAttachments(employeeAttachments);

  const fullName = record.agreementEmployeeName || record.fullNameAsPerAadhaar;
  const results = await Promise.allSettled([
    sendTransactionalEmail({
      sender: from,
      to: [{ email: hrEmail, name: "Netcradus HR" }],
      subject: `New Employee Onboarding Completed — ${fullName}`,
      htmlContent: hrTemplate(record),
      attachment: normalizedHrAttachments,
    }),
    sendTransactionalEmail({
      sender: from,
      to: [{ email: record.personalEmail, name: record.agreementEmployeeName }],
      subject: "Your Employment Agreement — Netcradus Pvt. Ltd.",
      htmlContent: employeeTemplate(record),
      attachment: normalizedEmployeeAttachments,
    }),
  ]);

  if (results[0].status === "fulfilled") {
    record.hrNotifiedAt = new Date();
  } else {
    errors.push(`HR email failed: ${results[0].reason?.message || "Unknown error"}`);
  }

  if (results[1].status === "fulfilled") {
    record.employeeConfirmationSentAt = new Date();
  } else {
    errors.push(`Employee email failed: ${results[1].reason?.message || "Unknown error"}`);
  }

  if (errors.length) {
    record.emailError = [record.emailError, ...errors].filter(Boolean).join(" | ");
  }

  await record.save();
};

module.exports = {
  sendOnboardingEmails,
};
