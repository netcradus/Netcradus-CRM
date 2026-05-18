const express = require("express");
const { deleteMessage, editMessage } = require("../controllers/chatController");

const router = express.Router();

router.put("/:id", editMessage);
router.delete("/:id", deleteMessage);

module.exports = router;
