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
    // Partner-owned vendors are scoped by partnerId so partner accounts only see their own records.
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    contactPerson: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
