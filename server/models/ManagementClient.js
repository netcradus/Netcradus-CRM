const mongoose = require("mongoose");

const managementClientSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Active", "Prospect", "On Hold", "Archived"],
      default: "Active",
    },
    segment: { type: String, trim: true, default: "General" },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagementClient", managementClientSchema);
