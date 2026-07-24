const express = require("express");
const { deleteMessage, editMessage, uploadChatFile, getChatFile, toggleMessageReaction, forwardMessage, deleteMessageForMe, deleteMessageForEveryone } = require("../controllers/chatController");

const router = express.Router();

router.put("/:id", editMessage);
router.delete("/:id", deleteMessage);
router.post("/upload", uploadChatFile);
router.get("/file/:filename", getChatFile);
router.patch("/:id/reaction", toggleMessageReaction);
router.post("/:id/forward", forwardMessage);
router.patch("/:id/delete-for-me", deleteMessageForMe);
router.patch("/:id/delete-for-everyone", deleteMessageForEveryone);

module.exports = router;
