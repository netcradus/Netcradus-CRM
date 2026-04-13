const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createConversation,
  getConversationMessages,
  getConversations,
  hideConversation,
} = require("../controllers/chatController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConversations);
router.post("/", createConversation);
router.delete("/:id", hideConversation);
router.get("/:id/messages", getConversationMessages);

module.exports = router;
