const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    content: String,
    type: {
      type: String,
    },
  },
  { _id: false }
);

const onboardingRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  fullNameAsPerAadhaar: {
    type: String,
    trim: true,
    required: true,
  },
  employeeId: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  dateOfJoining: Date,
  officialEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  mobileNumber: {
    type: String,
    trim: true,
  },
  aadhaarNumber: {
    type: String,
    trim: true,
  },
  nameOnAadhaar: {
    type: String,
    trim: true,
  },
  dateOfBirth: Date,
  currentAddress: {
    type: String,
    trim: true,
  },
  personalEmail: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
  },
  aadhaarCopyFileId: {
    type: String,
    default: null,
  },
  aadhaarCopyFileName: String,
  aadhaarCopyAttachment: attachmentSchema,
  photoFileId: {
    type: String,
    default: null,
  },
  photoFileName: String,
  photoAttachment: attachmentSchema,
  addressProofFileId: {
    type: String,
    default: null,
  },
  addressProofFileName: String,
  addressProofAttachment: attachmentSchema,
  selfAttestationSignature: {
    type: String,
    trim: true,
    required: true,
  },
  selfAttestationTimestamp: Date,
  selfAttestationIp: String,
  agreementEmployeeName: {
    type: String,
    trim: true,
    required() {
      return this.onboardingStatus === "complete";
    },
  },
  agreementRole: {
    type: String,
    trim: true,
    required() {
      return this.onboardingStatus === "complete";
    },
  },
  agreementEmploymentType: {
    type: String,
    enum: ["Internship", "Full Time"],
    required() {
      return this.onboardingStatus === "complete";
    },
  },
  agreementDate: {
    type: Date,
    required() {
      return this.onboardingStatus === "complete";
    },
  },
  agreementVersion: {
    type: String,
    default: "v1.0",
  },
  agreementSignature: {
    type: String,
    trim: true,
    required() {
      return this.onboardingStatus === "complete";
    },
  },
  agreementSignedAt: Date,
  agreementSignedIp: String,
  agreementUserAgent: String,
  onboardingStatus: {
    type: String,
    enum: ["pending", "step1_complete", "complete"],
    default: "pending",
  },
  hrNotifiedAt: Date,
  employeeConfirmationSentAt: Date,
  emailError: String,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

onboardingRecordSchema.pre("save", function saveHook(next) {
  this.updatedAt = new Date();
  next();
});

onboardingRecordSchema.index({ onboardingStatus: 1 });

module.exports = mongoose.model("OnboardingRecord", onboardingRecordSchema);
