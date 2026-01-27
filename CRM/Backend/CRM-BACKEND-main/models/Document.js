const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["PDF", "DOCX", "XLSX", "TXT"], required: true },
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    owner: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
