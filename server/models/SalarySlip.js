const mongoose = require("mongoose");

const SalarySlipSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
    index: true
  },
  employeeId: { type: String, trim: true },
  filename: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now },

  // Period
  month:   { type: String, trim: true },
  year:    { type: Number },
  payDate: { type: Date },

  // Department context stored per-slip so old PDFs remain reproducible
  department: { type: String, trim: true, default: "" },

  // ── Common Earnings ──────────────────────────────────────────────────────
  basicSalary:      { type: Number, default: 0 },
  hra:              { type: Number, default: 0 },
  dearnessAllowance:{ type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  otherEarnings:    { type: Number, default: 0 },

  // ── Sales-Specific Earnings ──────────────────────────────────────────────
  travelAllowance:         { type: Number, default: 0 },
  salesIncentive:          { type: Number, default: 0 },
  commission:              { type: Number, default: 0 },
  commissionRate:          { type: Number, default: 0 },
  monthlyTarget:           { type: Number, default: 0 },
  achievedSales:           { type: Number, default: 0 },
  targetAchievementBonus:  { type: Number, default: 0 },
  clientAcquisitionBonus:  { type: Number, default: 0 },

  // ── IT-Specific Earnings ─────────────────────────────────────────────────
  conveyance:              { type: Number, default: 0 },
  technicalAllowance:      { type: Number, default: 0 },
  internetAllowance:       { type: Number, default: 0 },
  wfhAllowance:            { type: Number, default: 0 },
  nightShiftAllowance:     { type: Number, default: 0 },
  onCallAllowance:         { type: Number, default: 0 },
  overtimePay:             { type: Number, default: 0 },
  projectCompletionBonus:  { type: Number, default: 0 },

  // ── Shared Bonus (Sales + IT) ────────────────────────────────────────────
  performanceBonus: { type: Number, default: 0 },

  // ── Legacy fields kept for old-record backward-compatibility only ─────────
  bonus:         { type: Number, default: 0 },
  providentFund: { type: Number, default: 0 },

  // ── Common Deductions ────────────────────────────────────────────────────
  professionalTax: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  lopDeduction:    { type: Number, default: 0 },

  // ── Attendance ────────────────────────────────────────────────────────────
  workingDays: { type: Number, default: 0 },
  paidDays:    { type: Number, default: 0 },
  lopDays:     { type: Number, default: 0 },

  // ── Payment Info ──────────────────────────────────────────────────────────
  paymentMode:      { type: String, trim: true, default: "" },
  bankAccountLast4: { type: String, trim: true, default: "" },

  // ── Calculated Totals ─────────────────────────────────────────────────────
  grossPay:        { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netPay:          { type: Number, default: 0 },

  notes: { type: String, trim: true },

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

// Compound index for finding salary slips by contact and month/year
SalarySlipSchema.index({ contactId: 1, year: -1, month: 1 });

module.exports = mongoose.model("SalarySlip", SalarySlipSchema);
