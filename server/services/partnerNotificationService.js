const axios = require("axios");
const TaskNotification = require("../models/TaskNotification");
const User = require("../models/User");

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_STATUSES = new Set(["approved", "in_progress", "completed", "on_hold", "cancelled"]);

const statusLabel = (status = "") =>
  String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const sendPartnerEmail = async ({ partner, subject, htmlContent }) => {
  if (!process.env.BREVO_API_KEY || !partner?.email) return;

  await axios.post(
    BREVO_URL,
    {
      sender: {
        email: process.env.PARTNER_FROM_EMAIL || process.env.ONBOARDING_FROM_EMAIL || "partners@netcradus.com",
        name: process.env.PARTNER_FROM_NAME || "Netcradus Partner Desk",
      },
      to: [{ email: partner.email, name: partner.name || partner.email }],
      subject,
      htmlContent,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );
};

const notifyPartner = async ({ project, message, type = "partner_project", emailSubject, emailBody, shouldEmail = false }) => {
  if (!project?.partnerId) return;

  const partner = await User.findById(project.partnerId).select("_id name email role").lean();
  if (!partner || partner.role !== "partner") return;

  // Partner notifications reuse the existing bell notification collection with a partner target path.
  await TaskNotification.create({
    userId: partner._id,
    message,
    targetPath: `/partner/projects/${project._id}`,
    type,
  });

  if (!shouldEmail) return;

  try {
    await sendPartnerEmail({
      partner,
      subject: emailSubject,
      htmlContent: emailBody,
    });
  } catch (error) {
    console.error("[PartnerNotification] Email failed:", error.message);
  }
};

const notifyPartnerStatusChange = async (project, previousStatus) => {
  if (!project?.partnerId || previousStatus === project.status) return;

  const label = statusLabel(project.status);
  await notifyPartner({
    project,
    message: `Project "${project.name}" status changed to ${label}.`,
    emailSubject: `Project status updated: ${label}`,
    emailBody: `<p>Your project <strong>${project.name}</strong> status changed to <strong>${label}</strong>.</p>`,
    shouldEmail: EMAIL_STATUSES.has(project.status),
  });
};

const notifyPartnerEngineerAssigned = async (project) => {
  await notifyPartner({
    project,
    message: `An engineer was assigned to project "${project.name}".`,
  });
};

const notifyPartnerFileUploaded = async (project, fileName = "A file") => {
  await notifyPartner({
    project,
    message: `${fileName} was uploaded to project "${project.name}".`,
    emailSubject: `New project file uploaded: ${project.name}`,
    emailBody: `<p>${fileName} was uploaded to your project <strong>${project.name}</strong>.</p>`,
    shouldEmail: true,
  });
};

const notifyPartnerInvoiceGenerated = async (project) => {
  await notifyPartner({
    project,
    message: `An invoice was generated for project "${project.name}".`,
    emailSubject: `Invoice generated: ${project.name}`,
    emailBody: `<p>An invoice was generated for your project <strong>${project.name}</strong>.</p>`,
    shouldEmail: true,
  });
};

const notifyPartnerInternalNote = async (project) => {
  await notifyPartner({
    project,
    message: `An internal note was added to project "${project.name}".`,
  });
};

module.exports = {
  notifyPartnerStatusChange,
  notifyPartnerEngineerAssigned,
  notifyPartnerFileUploaded,
  notifyPartnerInvoiceGenerated,
  notifyPartnerInternalNote,
};
