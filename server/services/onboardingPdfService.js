const PDFDocument = require("pdfkit");
const {
  COMPANY,
  AGREEMENT_SECTIONS,
  NDA_SECTIONS,
  VERIFICATION_DECLARATION,
} = require("../constants/onboardingContent");

const TIMEZONE = "Asia/Kolkata";

const formatDate = (value, options = {}) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...options,
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

const createDocument = () => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    bufferPages: true,
  });

  doc.font("Helvetica");
  doc.on("pageAdded", () => {
    addHeader(doc);
    doc.moveDown(2);
  });

  addHeader(doc);
  doc.moveDown(2);
  return doc;
};

const addHeader = (doc) => {
  const top = 28;
  doc.save();
  doc.rect(50, top, 495, 52).fill(COMPANY.accentColor);
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(COMPANY.name, 62, top + 10, { width: 250 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .text(`${COMPANY.website} | ${COMPANY.email} | ${COMPANY.tollFree}`, 62, top + 30, {
      width: 420,
    });
  doc.restore();
  doc.fillColor("#000000").font("Helvetica").fontSize(12);
  doc.y = 100;
};

const addFooters = (doc) => {
  const range = doc.bufferedPageRange();

  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        `${COMPANY.indiaOffice} | ${COMPANY.globalOffice} | GST: ${COMPANY.gst}`,
        50,
        770,
        { width: 495, align: "center" }
      )
      .text(`Page ${index + 1} of ${range.count}`, 50, 785, { width: 495, align: "center" });
  }
}

const finalizeBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    addFooters(doc);
    doc.end();
  });

const ensurePageSpace = (doc, minimumHeight = 120) => {
  if (doc.y > doc.page.height - doc.page.margins.bottom - minimumHeight) {
    doc.addPage();
  }
};

const writeParagraph = (doc, text, options = {}) => {
  ensurePageSpace(doc);
  doc.font("Helvetica").fontSize(12).fillColor("#111827").text(text, {
    align: "justify",
    lineGap: 4,
    ...options,
  });
  doc.moveDown(0.8);
};

const writeSection = (doc, title, paragraphs) => {
  ensurePageSpace(doc, 180);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#111827").text(title);
  doc.moveDown(0.5);
  paragraphs.forEach((paragraph) => writeParagraph(doc, paragraph));
};

const generateAgreementPdf = async (record) => {
  const doc = createDocument();

  doc.font("Helvetica").fontSize(12).text(`Date: ${formatDate(record.agreementDate)}`);
  doc.moveDown(1);
  doc.font("Helvetica-Bold").fontSize(18).text("NETCRADUS EMPLOYMENT AGREEMENT", {
    align: "center",
  });
  doc.moveDown(1);
  writeParagraph(
    doc,
    `This Agreement is Between: ${COMPANY.name} AND ${record.agreementEmployeeName}.`
  );

  AGREEMENT_SECTIONS.forEach((section) => writeSection(doc, section.title, section.paragraphs));
  NDA_SECTIONS.forEach((section) => writeSection(doc, section.title, section.paragraphs));

  ensurePageSpace(doc, 220);
  doc.font("Helvetica-Bold").fontSize(13).text("Digital Signature Details");
  doc.moveDown(0.5);
  writeParagraph(doc, `Employee Signature: ${record.agreementSignature}`);
  writeParagraph(doc, `Signed At: ${formatDateTime(record.agreementSignedAt)}`);
  writeParagraph(doc, `IP Address: ${record.agreementSignedIp || "N/A"}`);
  writeParagraph(doc, `User Agent: ${record.agreementUserAgent || "N/A"}`);
  writeParagraph(
    doc,
    "This document was digitally signed via the Netcradus CRM onboarding portal in accordance with the Information Technology Act, 2000."
  );
  writeParagraph(doc, "Company Signature: Netcradus Private Limited (pre-signed)");

  return finalizeBuffer(doc);
};

const listUploadedDocuments = (record) =>
  [
    record.aadhaarCopyFileName && `Aadhaar Copy: ${record.aadhaarCopyFileName}`,
    record.photoFileName && `Photograph: ${record.photoFileName}`,
    record.addressProofFileName && `Address Proof: ${record.addressProofFileName}`,
  ].filter(Boolean);

const generateVerificationPdf = async (record) => {
  const doc = createDocument();

  doc.font("Helvetica-Bold").fontSize(18).text("NETCRADUS EMPLOYMENT VERIFICATION", {
    align: "center",
  });
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(14).text("Employee Identity Verification Form", {
    align: "center",
  });
  doc.moveDown(1.2);

  [
    `Full Name (as per Aadhaar): ${record.fullNameAsPerAadhaar}`,
    `Employee ID: ${record.employeeId || "N/A"}`,
    `Department: ${record.department || "N/A"}`,
    `Designation: ${record.designation || "N/A"}`,
    `Date of Joining: ${formatDate(record.dateOfJoining)}`,
    `Official Email: ${record.officialEmail || "N/A"}`,
    `Mobile Number: ${record.mobileNumber || "N/A"}`,
    `Personal Email: ${record.personalEmail || "N/A"}`,
  ].forEach((line) => writeParagraph(doc, line));

  writeSection(doc, "Aadhaar Information", [
    `Aadhaar Number: ${record.aadhaarNumber || "N/A"}`,
    `Name on Aadhaar: ${record.nameOnAadhaar || "N/A"}`,
    `Date of Birth: ${formatDate(record.dateOfBirth)}`,
    `Current Residential Address: ${record.currentAddress || "N/A"}`,
  ]);

  const uploadedDocuments = listUploadedDocuments(record);
  writeSection(doc, "Document Upload Section", uploadedDocuments.length ? uploadedDocuments : ["No documents uploaded."]);

  writeSection(doc, "Self-Attestation Declaration", [
    VERIFICATION_DECLARATION,
    `Signature: ${record.selfAttestationSignature}`,
    `Date: ${formatDateTime(record.selfAttestationTimestamp)}`,
    `IP: ${record.selfAttestationIp || "N/A"}`,
  ]);

  writeSection(doc, "Office Use Only", [
    "Aadhaar Verified: ____________________",
    "Documents Verified: ____________________",
    "HR Approval: ____________________",
    "Verification Date: ____________________",
    "Verified By: ____________________",
    "Remarks: ________________________________________________",
  ]);

  return finalizeBuffer(doc);
};

module.exports = {
  generateAgreementPdf,
  generateVerificationPdf,
};
