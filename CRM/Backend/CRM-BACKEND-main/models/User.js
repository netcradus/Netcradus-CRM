const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "sales", "support"],
    default: "sales"
  },
  resetToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
