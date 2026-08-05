const mongoose = require("mongoose");
const Counter = require("./Counter");

const invoiceSchema = new mongoose.Schema(
  {
    // Original Fields
    customer: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Paid", "Unpaid", "Partially Paid", "Cancelled", "Draft", "Sent", "Partial", "Overdue"],
      default: "Unpaid",
    },
    sourceType: {
      type: String,
      enum: ["manual", "expense"],
      default: "manual",
    },
    sourceKey: { type: String, trim: true },
    sourceTitle: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Phase 2 Client-Linked Extended Fields
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null, index: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientContract", default: null, index: true },
    invoiceNumber: { type: String, unique: true, sparse: true, trim: true, index: true },
    issueDate: { type: Date, default: Date.now },
    currency: { type: String, enum: ["INR", "USD", "EUR", "GBP"], default: "INR" },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxType: { type: String, enum: ["Percentage", "Fixed"], default: "Percentage" },
    taxValue: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ["Percentage", "Fixed"], default: "Percentage" },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Draft", "Sent", "Partial", "Paid", "Overdue", "Cancelled"],
      default: "Draft",
      index: true
    },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        paymentDate: { type: Date, default: Date.now },
        paymentMethod: {
          type: String,
          enum: ["Bank Transfer", "UPI", "Card", "Cash", "Cheque", "Other"],
          default: "Bank Transfer"
        },
        referenceNumber: { type: String, trim: true },
        notes: { type: String, trim: true },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
      }
    ],
    notes: { type: String, trim: true },
    terms: { type: String, trim: true },
    lineItems: [
      {
        description: { type: String, trim: true },
        quantity: { type: Number, default: 1 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

invoiceSchema.pre("save", async function (next) {
  if (this.clientId && !this.invoiceNumber) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: "invoiceId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.invoiceNumber = `INV-${String(counter.seq).padStart(3, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
