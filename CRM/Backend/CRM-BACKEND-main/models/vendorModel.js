const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["Supplier", "Partner"],
      required: true,
    },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    lastInteraction: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
