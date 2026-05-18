const express = require("express");
const rbac = require("../middleware/rbac");
const approvalController = require("../controllers/approvalController");

const router = express.Router();

router.use(rbac(["admin", "hr", "super_user"]));

router.get("/queue", approvalController.getApprovalQueue);

module.exports = router;
