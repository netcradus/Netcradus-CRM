const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { deleteMessage, editMessage } = require("../controllers/chatController");

const router = express.Router();

router.use(authMiddleware);

router.put("/:id", editMessage);
router.delete("/:id", deleteMessage);

module.exports = router;
