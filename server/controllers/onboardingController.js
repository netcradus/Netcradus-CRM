const OnboardingRecord = require("../models/OnboardingRecord");
const onboardingPdfService = require("../services/onboardingPdfService");
const onboardingEmailService = require("../services/onboardingEmailService");
const { isDriveEnabled } = require("../utils/featureFlags");

const GRACE_DAYS = Number(process.env.ONBOARDING_GRACE_PERIOD_DAYS || 3);
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeName = (value = "") => String(value).trim().replace(/\s+/g, " ");
const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
const isValidDate = (value) => value && !Number.isNaN(new Date(value).getTime());

const buildStatusPayload = async (userId, createdAt) => {
  let record = null;
  try {
    record = await OnboardingRecord.findOne({ userId })
      .select("onboardingStatus completedAt")
      .maxTimeMS(1000)
      .lean();
  } catch (error) {
    console.error("[Onboarding] Status lookup failed:", error.message);
  }
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const daysRemaining = Math.max(0, Math.ceil((GRACE_MS - elapsed) / DAY_MS));

  return {
    status: record?.onboardingStatus || "pending",
    hasRecord: Boolean(record),
    completedAt: record?.completedAt || null,
    daysRemaining,
  };
};

const validateStep1 = (payload) => {
  const errors = {};
  const fullName = normalizeName(payload.fullNameAsPerAadhaar);
  const aadhaarNumber = String(payload.aadhaarNumber || "").trim();
  const personalEmail = normalizeEmail(payload.personalEmail);
  const officialEmail = normalizeEmail(payload.officialEmail);
  const signature = normalizeName(payload.selfAttestationSignature);
  const mobileNumber = String(payload.mobileNumber || "").trim();

  if (!fullName || !/^[A-Za-z ]+$/.test(fullName)) {
    errors.fullNameAsPerAadhaar = "Enter a valid full name using letters and spaces only.";
  }

  if (!/^\d{12}$/.test(aadhaarNumber)) {
    errors.aadhaarNumber = "Aadhaar number must be exactly 12 digits.";
  }

  if (!payload.nameOnAadhaar || normalizeName(payload.nameOnAadhaar).length < 3) {
    errors.nameOnAadhaar = "Name on Aadhaar is required.";
  }

  if (!isValidDate(payload.dateOfBirth)) {
    errors.dateOfBirth = "Date of birth is required.";
  }

  if (!payload.currentAddress || String(payload.currentAddress).trim().length < 10) {
    errors.currentAddress = "Current residential address is required.";
  }

  if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
    errors.mobileNumber = "Enter a valid 10-digit Indian mobile number.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
    errors.personalEmail = "Enter a valid personal email address.";
  } else if (personalEmail.endsWith("@netcradus.com")) {
    errors.personalEmail = "Use a personal email address, not your work email.";
  } else if (officialEmail && personalEmail === officialEmail) {
    errors.personalEmail = "Personal email must be different from your work email.";
  }

  if (!signature || signature.length < 3) {
    errors.selfAttestationSignature = "Typed signature is required.";
  } else if (signature.toLowerCase() !== fullName.toLowerCase()) {
    errors.selfAttestationSignature = "Typed signature must match the full name as per Aadhaar.";
  }

  return {
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
};

const validateStep2 = (payload) => {
  const errors = {};
  const fullName = normalizeName(payload.agreementEmployeeName);
  const signature = normalizeName(payload.agreementSignature);

  if (!fullName || fullName.length < 3) {
    errors.agreementEmployeeName = "Full name is required.";
  }

  if (!payload.agreementRole || !String(payload.agreementRole).trim()) {
    errors.agreementRole = "Role is required.";
  }

  if (!["Internship", "Full Time"].includes(payload.agreementEmploymentType)) {
    errors.agreementEmploymentType = "Select a valid employment type.";
  }

  if (!isValidDate(payload.agreementDate)) {
    errors.agreementDate = "Enter a valid agreement date.";
  }

  if (!signature) {
    errors.agreementSignature = "Typed signature is required.";
  } else if (signature.toLowerCase() !== fullName.toLowerCase()) {
    errors.agreementSignature = "Typed signature must exactly match the name entered above.";
  }

  return {
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
};

const processUpload = async (file, employeeUserId) => {
  if (!file) {
    return null;
  }

  if (!isDriveEnabled()) {
    return null;
  }

  try {
    const onboardingDriveService = require("../services/onboardingDriveService");
    return await onboardingDriveService.uploadToHrFolder(
      file.buffer,
      file.originalname,
      file.mimetype,
      employeeUserId
    );
  } catch (error) {
    console.error(`[Onboarding] Failed to upload ${file.originalname}:`, error.message);
    return null;
  }
};

const buildFallbackAttachment = (file) => {
  if (!file) {
    return null;
  }

  return {
    name: file.originalname,
    content: file.buffer.toString("base64"),
    type: file.mimetype || "application/octet-stream",
  };
};

const getOnboardingStatus = async (req, res) => {
  // Partners are exempt because onboarding documents apply only to employee accounts.
  if (req.user.role === "super_user" || req.user.role === "partner" || req.user.skipOnboarding) {
    return res.json({
      status: "complete",
      hasRecord: false,
      completedAt: null,
      daysRemaining: GRACE_DAYS,
    });
  }

  const payload = await buildStatusPayload(req.user.id, req.user.createdAt);
  return res.json(payload);
};

const submitStep1 = async (req, res) => {
  // Partners must never enter the employee onboarding submission flow.
  if (req.user.role === "super_user" || req.user.role === "partner" || req.user.skipOnboarding) {
    return res.status(403).json({ success: false, message: "Super user onboarding is exempt." });
  }

  const validation = validateStep1(req.body);
  const files = req.files || {};
  const existingRecord = await OnboardingRecord.findOne({ userId: req.user.id });

  if (existingRecord?.onboardingStatus === "complete") {
    return res.json({
      success: true,
      status: "complete",
    });
  }

  if (files.photo?.[0] && !files.photo[0].mimetype.startsWith("image/")) {
    validation.errors.photo = "Passport size photograph must be an image.";
  }

  if (Object.keys(validation.errors).length > 0) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const uploads = await Promise.all([
    processUpload(files.aadhaarCopy?.[0], req.user.id),
    processUpload(files.photo?.[0], req.user.id),
    processUpload(files.addressProof?.[0], req.user.id),
  ]);

  const [aadhaarCopy, photo, addressProof] = uploads;
  const record = existingRecord || new OnboardingRecord({ userId: req.user.id });
  const aadhaarCopyFile = files.aadhaarCopy?.[0];
  const photoFile = files.photo?.[0];
  const addressProofFile = files.addressProof?.[0];

  record.fullNameAsPerAadhaar = normalizeName(req.body.fullNameAsPerAadhaar);
  record.employeeId = String(req.body.employeeId || "").trim();
  record.department = String(req.body.department || "").trim();
  record.designation = String(req.body.designation || "").trim();
  record.dateOfJoining = isValidDate(req.body.dateOfJoining) ? new Date(req.body.dateOfJoining) : null;
  record.officialEmail = normalizeEmail(req.body.officialEmail);
  record.mobileNumber = String(req.body.mobileNumber || "").trim();
  record.aadhaarNumber = String(req.body.aadhaarNumber || "").trim();
  record.nameOnAadhaar = normalizeName(req.body.nameOnAadhaar);
  record.dateOfBirth = new Date(req.body.dateOfBirth);
  record.currentAddress = String(req.body.currentAddress || "").trim();
  record.personalEmail = normalizeEmail(req.body.personalEmail);
  record.selfAttestationSignature = normalizeName(req.body.selfAttestationSignature);
  record.selfAttestationTimestamp = new Date();
  record.selfAttestationIp = req.ip;
  record.onboardingStatus = "step1_complete";

  if (aadhaarCopy) {
    record.aadhaarCopyFileId = aadhaarCopy.driveFileId;
  }

  if (aadhaarCopyFile) {
    record.aadhaarCopyFileName = aadhaarCopyFile.originalname;
    record.aadhaarCopyAttachment = buildFallbackAttachment(aadhaarCopyFile);
  }

  if (photo) {
    record.photoFileId = photo.driveFileId;
  }

  if (photoFile) {
    record.photoFileName = photoFile.originalname;
    record.photoAttachment = buildFallbackAttachment(photoFile);
  }

  if (addressProof) {
    record.addressProofFileId = addressProof.driveFileId;
  }

  if (addressProofFile) {
    record.addressProofFileName = addressProofFile.originalname;
    record.addressProofAttachment = buildFallbackAttachment(addressProofFile);
  }

  await record.save();

  return res.json({
    success: true,
    status: "step1_complete",
  });
};

const submitStep2 = async (req, res) => {
  // Partners must never receive onboarding emails or files from step-two completion.
  if (req.user.role === "super_user" || req.user.role === "partner" || req.user.skipOnboarding) {
    return res.status(403).json({ success: false, message: "Super user onboarding is exempt." });
  }

  const agreementEmployeeName = String(req.body.agreementEmployeeName || "");
  const agreementSignature = String(req.body.agreementSignature || "");

  if (
    agreementSignature.trim().toLowerCase() !==
    agreementEmployeeName.trim().toLowerCase()
  ) {
    return res.status(400).json({
      success: false,
      message: "Signature must match your full name exactly.",
      code: "SIGNATURE_MISMATCH",
    });
  }

  const validation = validateStep2(req.body);
  if (validation.hasErrors) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const record = await OnboardingRecord.findOne({ userId: req.user.id });
  if (!record || record.onboardingStatus === "pending") {
    return res.status(400).json({
      success: false,
      message: "Complete identity verification before signing the agreement.",
    });
  }

  if (record.onboardingStatus === "complete") {
    return res.json({
      success: true,
      status: "complete",
      personalEmail: record.personalEmail,
    });
  }

  record.agreementEmployeeName = normalizeName(req.body.agreementEmployeeName);
  record.agreementRole = String(req.body.agreementRole || "").trim();
  record.agreementEmploymentType = req.body.agreementEmploymentType;
  record.agreementDate = new Date(req.body.agreementDate);
  record.agreementSignature = normalizeName(req.body.agreementSignature);
  record.agreementSignedAt = new Date();
  record.agreementSignedIp = req.ip;
  record.agreementUserAgent = req.headers["user-agent"] || "";
  record.agreementVersion = "v1.0";
  record.onboardingStatus = "complete";
  record.completedAt = new Date();

  await record.save();

  const pdfAttachments = [];

  try {
    const [agreementPdf, verificationPdf] = await Promise.all([
      onboardingPdfService.generateAgreementPdf(record),
      onboardingPdfService.generateVerificationPdf(record),
    ]);

    pdfAttachments.push(
      {
        name: `Employment-Agreement-${record.agreementEmployeeName}.pdf`,
        content: agreementPdf.toString("base64"),
        type: "application/pdf",
      },
      {
        name: `Identity-Verification-${record.agreementEmployeeName}.pdf`,
        content: verificationPdf.toString("base64"),
        type: "application/pdf",
      }
    );
  } catch (error) {
    console.error("[Onboarding] PDF generation failed:", error.message);
    record.emailError = [record.emailError, `PDF generation failed: ${error.message}`]
      .filter(Boolean)
      .join(" | ");
    await record.save();
  }

  console.log("Drive file IDs:", {
    aadhaar: record.aadhaarCopyFileId,
    photo: record.photoFileId,
    addressProof: record.addressProofFileId,
  });

  const driveFiles = [
    {
      fileId: record.aadhaarCopyFileId,
      fileName: record.aadhaarCopyFileName || record.aadhaarCopyAttachment?.name || "aadhaar-copy",
      fallbackAttachment: record.aadhaarCopyAttachment,
    },
    {
      fileId: record.photoFileId,
      fileName: record.photoFileName || record.photoAttachment?.name || "employee-photo",
      fallbackAttachment: record.photoAttachment,
    },
    {
      fileId: record.addressProofFileId,
      fileName: record.addressProofFileName || record.addressProofAttachment?.name || "address-proof",
      fallbackAttachment: record.addressProofAttachment,
    },
  ];

  const onboardingDriveService = isDriveEnabled()
    ? require("../services/onboardingDriveService")
    : null;
  const driveFetchResults = onboardingDriveService
    ? await Promise.allSettled(
        driveFiles
          .filter((file) => file.fileId !== null && file.fileId !== undefined)
          .map((file) => onboardingDriveService.getFileAsBase64(file.fileId, file.fileName))
      )
    : [];

  const driveAttachments = driveFetchResults
    .filter((result) => result.status === "fulfilled" && result.value !== null)
    .map((result) => result.value);

  const attachedNames = new Set(driveAttachments.map((attachment) => attachment.name));
  for (const file of driveFiles) {
    if (
      file.fallbackAttachment?.content &&
      !attachedNames.has(file.fallbackAttachment.name)
    ) {
      driveAttachments.push(file.fallbackAttachment);
      attachedNames.add(file.fallbackAttachment.name);
    }
  }

  try {
    const hrAttachments = [...pdfAttachments, ...driveAttachments];
    const employeeAttachments = pdfAttachments[0] ? [pdfAttachments[0]] : [];
    await onboardingEmailService.sendOnboardingEmails(record, hrAttachments, employeeAttachments);
  } catch (error) {
    console.error("[Onboarding] Email dispatch failed unexpectedly:", error.message);
    record.emailError = [record.emailError, `Email dispatch failed: ${error.message}`]
      .filter(Boolean)
      .join(" | ");
    await record.save();
  }

  return res.json({
    success: true,
    status: "complete",
    personalEmail: record.personalEmail,
  });
};

const getMyOnboardingRecord = async (req, res) => {
  // Partners have no employee onboarding record to expose.
  if (req.user.role === "super_user" || req.user.role === "partner") {
    return res.json({ success: true, data: null });
  }

  const record = await OnboardingRecord.findOne({ userId: req.user.id }).lean();

  if (!record) {
    return res.status(404).json({
      success: false,
      message: "Onboarding record not found.",
    });
  }

  const {
    aadhaarCopyAttachment,
    photoAttachment,
    addressProofAttachment,
    ...safeRecord
  } = record;

  return res.json({
    success: true,
    data: safeRecord,
  });
};

module.exports = {
  getOnboardingStatus,
  submitStep1,
  submitStep2,
  getMyOnboardingRecord,
};
