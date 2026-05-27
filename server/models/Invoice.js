const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Paid", "Unpaid", "Partially Paid", "Cancelled"],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
