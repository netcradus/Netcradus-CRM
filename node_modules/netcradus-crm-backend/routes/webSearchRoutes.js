const express = require("express");
const router = express.Router();
const webSearchController = require("../controllers/webSearchController");
const authMiddleware = require("../middleware/authMiddleware");
const { webSearchLimiter } = require("../middleware/rateLimiter");

// All search routes require JWT authentication
router.use(authMiddleware);

// Search endpoint with per-user rate limit (max 20 searches/min)
router.post("/web-search", webSearchLimiter, webSearchController.searchWeb);

// Search history logs (paginated, filtered, sorted)
router.get("/web-search/history", webSearchController.getHistory);

// Fetch detailed search log record
router.get("/web-search/history/:id", webSearchController.getHistoryItem);

// Soft delete specific search history item
router.delete("/web-search/history/:id", webSearchController.deleteHistoryItem);

// Clear all my search history logs (soft deletion)
router.delete("/web-search/history", webSearchController.clearAllHistory);

// Log click events on search card results
router.post("/web-search/click", webSearchController.trackClick);

// Log webpage visit initialization in internal CRM viewer
router.post("/web-search/visit", webSearchController.recordVisit);

// Update heartbeat and duration of webpage visit session
router.patch("/web-search/visit/:id", webSearchController.updateVisit);

// Grouped recent queries for tag presentation
router.get("/web-search/recent", webSearchController.getRecentSearches);

// Check if external link allows iframe embed and resolves to safe IP
router.get("/web-search/check-embed", webSearchController.checkEmbed);

module.exports = router;
