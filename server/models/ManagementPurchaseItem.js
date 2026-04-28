const mongoose = require("mongoose");

const managementPurchaseItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    vendorName: { type: String, trim: true, default: "" },
    expectedDeliveryDate: { type: Date },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Ordered", "Received"],
      default: "Pending",
    },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagementPurchaseItem", managementPurchaseItemSchema);
