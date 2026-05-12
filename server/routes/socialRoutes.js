const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const socialController = require("../controllers/socialController");
const { DIGITAL_MEDIA_ROLES } = require("../utils/digitalMediaAccess");

const router = express.Router();

router.use(authMiddleware, rbac(DIGITAL_MEDIA_ROLES));

router.get("/connections", socialController.getConnections);
router.post("/connect", socialController.connectPlatform);
router.delete("/connections/:platform", socialController.disconnectPlatform);

router.get("/posts", socialController.getPosts);
router.post("/posts", socialController.createPost);
router.patch("/posts/:id", socialController.updatePost);
router.delete("/posts/:id", socialController.deletePost);
router.post("/posts/:id/submit-for-review", socialController.submitPostForReview);
router.post("/posts/:id/approve", rbac(["admin", "hr", "super_user"]), socialController.approvePost);
router.post("/posts/:id/reject", rbac(["admin", "hr", "super_user"]), socialController.rejectPost);

router.get("/inbox", socialController.getInboxItems);
router.patch("/inbox/:id/read", socialController.markInboxItemRead);
router.post("/inbox/:id/reply", socialController.replyToInboxItem);

module.exports = router;
