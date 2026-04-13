const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getChatDirectory, getOnlineStatus } = require("../controllers/chatController");

const router = express.Router();

router.use(authMiddleware);

router.get("/online-status", getOnlineStatus);
router.get("/chat-directory", getChatDirectory);

module.exports = router;
