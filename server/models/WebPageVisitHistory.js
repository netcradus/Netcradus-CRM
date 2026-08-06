const mongoose = require("mongoose");

const webPageVisitHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  searchHistory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WebSearchHistory",
    required: true
  },
  clickHistory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WebSearchClick",
    default: null
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  pageTitle: {
    type: String,
    default: ""
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  resultPosition: {
    type: Number,
    default: 0
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  viewerStatus: {
    type: String,
    enum: ["loading", "opened", "iframe_blocked", "failed", "externally_opened", "closed"],
    required: true
  },
  navigationType: {
    type: String,
    enum: ["search_result", "refresh", "back", "forward", "external_fallback"],
    required: true
  },
  sessionId: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Add indices for performance
webPageVisitHistorySchema.index({ user: 1, openedAt: -1 });
webPageVisitHistorySchema.index({ searchHistory: 1 });
webPageVisitHistorySchema.index({ clickHistory: 1 });

module.exports = mongoose.model("WebPageVisitHistory", webPageVisitHistorySchema);
