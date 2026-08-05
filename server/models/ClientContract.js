const mongoose = require("mongoose");
const Counter = require("./Counter");

const clientContractSchema = new mongoose.Schema(
  {
    contractId: {
      type: String,
      unique: true,
      immutable: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    contractType: {
      type: String,
      enum: ["Service Agreement", "NDA", "SLA", "SOW", "AMC", "Subscription", "Other"],
      default: "Other",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    renewalDate: {
      type: Date,
      default: null,
    },
    contractValue: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },
    billingType: {
      type: String,
      enum: ["Fixed", "Hourly", "Monthly", "Annual", "Milestone"],
      default: "Fixed",
    },
    paymentTerms: {
      type: String,
      enum: ["Net 7", "Net 15", "Net 30", "Net 45", "Custom"],
      default: "Net 30",
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Expiring Soon", "Expired", "Terminated", "Renewed"],
      default: "Draft",
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
    },
    description: {
      type: String,
      default: "",
    },
    terms: {
      type: String,
      default: "",
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
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
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

clientContractSchema.pre("save", async function (next) {
  if (!this.contractId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: "contractId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.contractId = `CNT-${String(counter.seq).padStart(3, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("ClientContract", clientContractSchema);
