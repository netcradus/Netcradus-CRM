const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");
const rbac = require("../middleware/rbac");

router.use(rbac(["super_user", "hr"]));

router.get("/", interviewController.listInterviews);
router.post("/", interviewController.createInterview);
router.put("/:id", interviewController.updateInterview);
router.delete("/:id", interviewController.deleteInterview);

module.exports = router;
