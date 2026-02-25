const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
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
    enum: ["admin", "sales", "support", "hr", "it", "digital_media"],
    default: "sales"
  },
  
  resetToken: String,
  resetTokenExpiry: Date

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);