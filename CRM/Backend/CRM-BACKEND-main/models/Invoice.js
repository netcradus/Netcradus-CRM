const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
