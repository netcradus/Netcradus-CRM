const express = require("express");
const {
  createConversation,
  getConversationMessages,
  getConversations,
  hideConversation,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/", getConversations);
router.post("/", createConversation);
router.delete("/:id", hideConversation);
router.get("/:id/messages", getConversationMessages);

module.exports = router;
