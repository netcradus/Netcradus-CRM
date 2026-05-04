const mongoose = require("mongoose");

const SalarySlipSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
    index: true
  },
  filename: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now },
  month: { type: String, trim: true },
  year: { type: Number },
  payDate: { type: Date },
  basicSalary: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  conveyance: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  providentFund: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  grossPay: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
  notes: { type: String, trim: true },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

// compound index for finding salary slips by contact and month/year
SalarySlipSchema.index({ contactId: 1, year: -1, month: 1 });

module.exports = mongoose.model("SalarySlip", SalarySlipSchema);
