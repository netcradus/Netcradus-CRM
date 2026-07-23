const mongoose = require("mongoose");

const passwordHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '365d' // Optional: auto-delete after 1 year if desired
  }
});

// index for fast lookups by user and date
passwordHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("PasswordHistory", passwordHistorySchema);
