const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  policyCode: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      "hr",
      "leave",
      "attendance",
      "work_from_home",
      "it_security",
      "finance",
      "code_of_conduct",
      "data_privacy",
      "travel",
      "general"
    ],
    required: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: "1.0"
  },
  status: {
    type: String,
    enum: ["draft", "published", "archived", "expired"],
    default: "draft"
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  applicableToAll: {
    type: Boolean,
    default: false
  },
  applicableDepartments: [{
    type: String,
    trim: true
  }],
  applicableRoles: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document"
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  publishedAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  },
  parentPolicy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    default: null
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    default: null
  },
  isLatestVersion: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Optimize lookups and guarantee uniqueness per version
policySchema.index({ policyCode: 1, version: 1 }, { unique: true });
policySchema.index({ status: 1 });
policySchema.index({ category: 1 });
policySchema.index({ effectiveDate: 1 });
policySchema.index({ applicableDepartments: 1 });
policySchema.index({ applicableRoles: 1 });

module.exports = mongoose.model("Policy", policySchema);
