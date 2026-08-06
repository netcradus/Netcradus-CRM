const mongoose = require("mongoose");

const webSearchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  employeeId: {
    type: String,
    default: ""
  },
  employeeName: {
    type: String,
    default: ""
  },
  userEmail: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    default: ""
  },
  department: {
    type: String,
    default: ""
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  normalizedQuery: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  page: {
    type: Number,
    default: 1
  },
  resultCount: {
    type: Number,
    default: 0
  },
  searchStatus: {
    type: String,
    enum: ["success", "no_results", "failed", "timeout", "rate_limited"],
    required: true
  },
  responseTimeMs: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    default: "serper"
  },
  searchedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: ""
  },
  userAgent: {
    type: String,
    default: ""
  },
  browser: {
    type: String,
    default: ""
  },
  operatingSystem: {
    type: String,
    default: ""
  },
  deviceType: {
    type: String,
    default: ""
  },
  sessionId: {
    type: String,
    default: ""
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// MongoDB Indexes
webSearchHistorySchema.index({ user: 1, createdAt: -1 });
webSearchHistorySchema.index({ normalizedQuery: 1 });
webSearchHistorySchema.index({ createdAt: -1 });
webSearchHistorySchema.index({ searchStatus: 1 });
webSearchHistorySchema.index({ role: 1 });
webSearchHistorySchema.index({ department: 1 });

module.exports = mongoose.model("WebSearchHistory", webSearchHistorySchema);
