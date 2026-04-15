const mongoose = require("mongoose");

const managementPurchaseSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    vendorName: { type: String, trim: true, default: "" },
    amount: { type: Number, default: 0 },
    purchaseDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Completed", "Processing", "Cancelled"],
      default: "Completed",
    },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagementPurchase", managementPurchaseSchema);
