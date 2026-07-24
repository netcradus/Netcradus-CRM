const express = require("express");
const { deleteMessage, editMessage, uploadChatFile, getChatFile, toggleMessageReaction, forwardMessage } = require("../controllers/chatController");

const router = express.Router();

router.put("/:id", editMessage);
router.delete("/:id", deleteMessage);
router.post("/upload", uploadChatFile);
router.get("/file/:filename", getChatFile);
router.patch("/:id/reaction", toggleMessageReaction);
router.post("/:id/forward", forwardMessage);

module.exports = router;
