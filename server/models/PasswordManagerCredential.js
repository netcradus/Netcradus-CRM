const mongoose = require("mongoose");

const passwordManagerCredentialSchema = new mongoose.Schema(
  {
    accountName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    encryptedPassword: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

passwordManagerCredentialSchema.index({ accountName: 1, username: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.model("PasswordManagerCredential", passwordManagerCredentialSchema);
