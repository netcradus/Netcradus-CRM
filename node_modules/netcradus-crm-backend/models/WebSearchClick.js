const mongoose = require("mongoose");

const webSearchClickSchema = new mongoose.Schema({
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
  query: {
    type: String,
    required: true,
    trim: true
  },
  resultTitle: {
    type: String,
    required: true,
    trim: true
  },
  resultUrl: {
    type: String,
    required: true,
    trim: true
  },
  resultDomain: {
    type: String,
    required: true,
    trim: true
  },
  resultPosition: {
    type: Number,
    required: true
  },
  clickedAt: {
    type: Date,
    default: Date.now
  },
  openedInsideCrm: {
    type: Boolean,
    default: true
  },
  openMethod: {
    type: String,
    enum: ["iframe", "blocked", "external_fallback"],
    required: true
  },
  ipAddress: {
    type: String,
    default: ""
  },
  sessionId: {
    type: String,
    default: ""
  }
}, {
  timestamps: { createdAt: "clickedAt", updatedAt: false }
});

// Add indices for performance
webSearchClickSchema.index({ user: 1, clickedAt: -1 });
webSearchClickSchema.index({ searchHistory: 1 });

module.exports = mongoose.model("WebSearchClick", webSearchClickSchema);
