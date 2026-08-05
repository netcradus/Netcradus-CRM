const mongoose = require("mongoose");
const Counter = require("./Counter");

const clientNoteSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      immutable: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientType: {
      type: String,
      enum: ["Company", "Individual"],
      default: "Company",
    },

    // Business Information
    industry: { type: String, default: "" },
    website: { type: String, default: "" },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      default: "1-10",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Prospect", "On Hold", "Archived"],
      default: "Active",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "VIP"],
      default: "Medium",
    },
    clientSource: {
      type: String,
      enum: ["Referral", "Website", "LinkedIn", "Sales", "Campaign", "Other"],
      default: "Other",
    },

    // Primary Contact
    contactPersonName: { type: String, default: "" },
    contactPersonDesignation: { type: String, default: "" },
    primaryEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    primaryPhone: { type: String, default: "" },
    alternatePhone: { type: String, default: "" },
    preferredContactMethod: {
      type: String,
      enum: ["Email", "Phone", "WhatsApp"],
      default: "Email",
    },

    // Address
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" },

    // Legal and Tax
    gstNumber: { type: String, default: "", trim: true, uppercase: true },
    panNumber: { type: String, default: "", trim: true, uppercase: true },
    registrationNumber: { type: String, default: "", trim: true },

    // Assignment
    assignedAccountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedSalesPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Contract and Billing
    contractStartDate: { type: Date, default: null },
    contractEndDate: { type: Date, default: null },
    contractValue: { type: Number, default: 0 },
    billingType: {
      type: String,
      enum: ["Fixed", "Hourly", "Monthly"],
      default: "Fixed",
    },
    paymentTerms: {
      type: String,
      enum: ["Net 7", "Net 15", "Net 30", "Net 45", "Custom"],
      default: "Net 30",
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Partial", "Overdue", "Not Applicable"],
      default: "Not Applicable",
    },

    // Internal Management
    notes: [clientNoteSchema],
    tags: [{ type: String, trim: true }],
    attachments: [
      {
        fileName: { type: String, required: true },
        driveFileId: { type: String, required: true },
        fileSizeMB: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
        documentType: { type: String, default: "Other" },
      },
    ],
    clientRating: { type: Number, min: 1, max: 5, default: 3 },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    lastContactedDate: { type: Date, default: null },
    nextFollowUpDate: { type: Date, default: null },

    // Future Support Portal Fields
    supportAccessEnabled: { type: Boolean, default: false },
    supportUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    supportPortalStatus: {
      type: String,
      enum: ["Not Invited", "Invited", "Active", "Suspended"],
      default: "Not Invited",
    },
    supportAccessGrantedAt: { type: Date, default: null },
    supportAccessGrantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    supportUsers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isPrimary: { type: Boolean, default: false },
        status: { type: String, enum: ["Active", "Suspended"], default: "Active" },
        grantedAt: { type: Date, default: Date.now },
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ],

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    archivedAt: { type: Date, default: null },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

clientSchema.pre("save", async function (next) {
  if (!this.clientId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: "clientId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const seqNum = counter.seq;
      this.clientId = `CL-${String(seqNum).padStart(3, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

clientSchema.index({ clientId: 1 });
clientSchema.index({ clientName: 1 });
clientSchema.index({ primaryEmail: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ assignedAccountManager: 1 });
clientSchema.index({ assignedSalesPerson: 1 });

module.exports = mongoose.model("Client", clientSchema);
