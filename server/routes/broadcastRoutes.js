const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  markBroadcastRead
} = require("../controllers/broadcastController");

// Create (Publish) Broadcast - Super User and HR only
router.post("/", authMiddleware, rbac(["super_user", "hr"]), createBroadcast);

// Get Broadcasts (Filtered for current user)
router.get("/", authMiddleware, getBroadcasts);

// Get specific Broadcast details
router.get("/:id", authMiddleware, getBroadcastById);

// Mark specific Broadcast as read
router.patch("/:id/read", authMiddleware, markBroadcastRead);

module.exports = router;
