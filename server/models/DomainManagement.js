const mongoose = require("mongoose");

const domainManagementSchema = new mongoose.Schema(
  {
    project: {
      type: String,
      required: true,
      trim: true
    },
    repository: {
      type: String,
      required: true,
      trim: true
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    frontend: {
      type: String,
      required: true,
      trim: true
    },
    backend: {
      type: String,
      required: true,
      trim: true
    },
    api: {
      type: String,
      required: true,
      trim: true
    },
    hosting: {
      type: String,
      required: true,
      trim: true
    },
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DomainManagement", domainManagementSchema);
