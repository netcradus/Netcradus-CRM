const mongoose = require("mongoose");

const priceBookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },         // Name of price book
    currency: { type: String, required: true, trim: true },     // e.g., USD, INR
    type: { type: String, required: true, trim: true },         // Retail / Wholesale
    products: { type: String, required: true, trim: true },     // Associated products
    effectiveDate: { type: Date, required: true },              // Start date
    expiryDate: { type: Date, required: true },                 // End date
    status: { 
      type: String, 
      enum: ["Active", "Inactive"], 
      default: "Active" 
    },                                                          // Active / Inactive
    version: { type: String, required: true, trim: true },      // Version e.g. v1.0
  },
  { timestamps: true }
);

module.exports = mongoose.model("PriceBook", priceBookSchema);
