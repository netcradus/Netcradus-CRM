const express = require("express");
const router = express.Router();
const domainManagementController = require("../controllers/domainManagementController");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");

// Apply protection to all routes in this path
router.use(authMiddleware);
router.use(rbac(["super_user"]));

router.get("/", domainManagementController.getDomains);
router.get("/:id", domainManagementController.getDomainById);
router.post("/", domainManagementController.createDomain);
router.patch("/:id", domainManagementController.updateDomain);
router.delete("/:id", domainManagementController.deleteDomain);

module.exports = router;
