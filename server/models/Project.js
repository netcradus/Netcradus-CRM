const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    driveFileId: String,
    fileName: String,
    fileSizeMB: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  tagline: { type: String, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  showcaseDescription: { type: String, maxlength: 500 },
  status: {
    type: String,
    // Partner statuses are additive; existing portfolio statuses remain valid.
    enum: ["completed", "ongoing", "maintenance", "new", "under_review", "approved", "in_progress", "testing", "on_hold", "cancelled"],
    default: "completed",
  },
  startDate: Date,
  endDate: Date,
  industry: { type: String, trim: true },
  techStack: [{ type: String, trim: true }],
  thumbnail: { type: String, default: null },
  screenshots: [String],
  isVisibleInShowcase: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  clientName: { type: String, trim: true },
  clientCompany: { type: String, trim: true },
  clientCountry: { type: String, trim: true },
  clientWebsite: { type: String, trim: true },

  liveUrl: { type: String, trim: true },
  stagingUrl: { type: String, trim: true },
  githubUrl: { type: String, trim: true },

  deploymentPlatform: { type: String, trim: true },
  deploymentId: { type: String, trim: true },
  deploymentPassword: { type: String, trim: true },
  serverNotes: { type: String },
  environment: {
    type: String,
    enum: ["production", "staging", "both"],
    default: "production",
  },

  sensitiveFields: {
    type: [String],
    default: ["deploymentId", "deploymentPassword", "stagingUrl", "githubUrl", "serverNotes"],
  },

  documents: [documentSchema],

  // Partner project fields let external partners submit work without becoming employees.
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null, index: true },
  serviceType: { type: String, trim: true, default: "" },
  priority: { type: String, enum: ["Low", "Medium", "High", "Critical", ""], default: "" },
  expectedBudget: { type: Number, default: 0 },
  deadline: Date,
  partnerNotes: { type: String, trim: true, default: "" },
  internalNotes: { type: String, trim: true, default: "" },
  assignedEngineer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

projectSchema.index({ isDeleted: 1, isVisibleInShowcase: 1 });
projectSchema.index({ isFeatured: -1, createdAt: -1 });
projectSchema.index({ isDeleted: 1, createdBy: 1, createdAt: -1 });
projectSchema.index({ isDeleted: 1, createdAt: -1 });
projectSchema.index({ isDeleted: 1, partnerId: 1, createdAt: -1 });

projectSchema.pre("save", function setUpdatedAt(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Project", projectSchema);
