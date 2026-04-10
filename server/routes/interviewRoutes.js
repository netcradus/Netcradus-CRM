const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");

router.use(authMiddleware, rbac(["super_user", "hr"]));

router.get("/", interviewController.listInterviews);
router.post("/", interviewController.createInterview);
router.put("/:id", interviewController.updateInterview);
router.delete("/:id", interviewController.deleteInterview);

module.exports = router;
