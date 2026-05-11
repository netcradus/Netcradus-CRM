const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getChatDirectory, getOnlineStatus } = require("../controllers/chatController");
const { getNestedUserHierarchy } = require("../controllers/orgHierarchyController");
const rbac = require("../middleware/rbac");

const router = express.Router();

router.use(authMiddleware);

router.get("/online-status", getOnlineStatus);
router.get("/chat-directory", getChatDirectory);
router.get("/hierarchy", rbac(["super_user"]), getNestedUserHierarchy);

module.exports = router;
