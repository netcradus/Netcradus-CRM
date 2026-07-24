const mongoose = require("mongoose");

const EmployeeAssetSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Laptop",
        "Desktop",
        "Monitor",
        "Mobile",
        "Tablet",
        "Keyboard",
        "Mouse",
        "Headphones",
        "Charger",
        "Webcam",
        "Pendrive",
        "Docking Station",
        "SIM",
        "ID Card",
        "Accessories",
        "Other"
      ],
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    assetTag: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    model: {
      type: String,
      trim: true,
      default: "",
    },
    imeiNumber: {
      type: String,
      trim: true,
      default: "",
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: "",
    },
    accessoriesDescription: {
      type: String,
      trim: true,
      default: "",
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    conditionAtIssue: {
      type: String,
      required: true,
      enum: ["New", "Good", "Fair", "Damaged"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Assigned", "Returned", "Under Repair", "Lost", "Damaged"],
      default: "Assigned",
    },
    assignmentBatchId: {
      type: String,
      default: null,
      index: true,
    },
    customAssetType: {
      type: String,
      trim: true,
      default: "",
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    returnCondition: {
      type: String,
      enum: ["New", "Good", "Fair", "Damaged", "Lost", null],
      default: null,
    },
    returnNotes: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook for normalization
EmployeeAssetSchema.pre("save", function (next) {
  if (this.serialNumber) {
    this.serialNumber = String(this.serialNumber).trim().toUpperCase();
  }
  if (this.assetTag) {
    this.assetTag = String(this.assetTag).trim().toUpperCase();
  }
  if (this.imeiNumber) {
    this.imeiNumber = String(this.imeiNumber).replace(/\s/g, "");
  }
  if (this.mobileNumber) {
    this.mobileNumber = String(this.mobileNumber).trim();
  }
  next();
});

module.exports = mongoose.model("EmployeeAsset", EmployeeAssetSchema);
