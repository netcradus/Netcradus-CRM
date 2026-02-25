// const mongoose = require("mongoose");

// const accountSchema = new mongoose.Schema(
//   {
//     accountName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     accountOwner: {
//       type: String,
//       required: true,
//     },
//     industry: {
//       type: String,
//       default: "General",
//     },
//     phone: {
//       type: String,
//     },
//     email: {
//       type: String,
//     },
//     website: {
//       type: String,
//     },
//     billingAddress: {
//       street: String,
//       city: String,
//       state: String,
//       postalCode: String,
//       country: String,
//     },
//     shippingAddress: {
//       street: String,
//       city: String,
//       state: String,
//       postalCode: String,
//       country: String,
//     },
//     annualRevenue: {
//       type: Number,
//     },
//     description: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Account", accountSchema);




const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    accountName: { type: String, required: true, trim: true },
    accountOwner: { type: String, required: true },
    industry: { type: String, default: "General" },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    annualRevenue: { type: Number },
    description: { type: String },
    status: { type: String, default: "Active" },      
    lastContacted: { type: Date },                     
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
