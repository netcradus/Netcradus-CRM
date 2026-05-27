const express = require("express");
const router = express.Router();
const partnerController = require("../controllers/partnerController");
const rbac = require("../middleware/rbac");
const upload = require("../middleware/upload");

// Partner routes are shared by partners and admins so admins can inspect the same scoped data.
router.use(rbac(["partner", "admin", "super_user"]));

router.get("/dashboard", partnerController.getDashboard);
router.get("/vendors", partnerController.getVendors);
router.post("/vendors", partnerController.createVendor);
router.patch("/vendors/:id", partnerController.updateVendor);
router.patch("/vendors/:id/deactivate", partnerController.deactivateVendor);

router.get("/projects", partnerController.getProjects);
router.post("/projects", partnerController.createProject);
router.get("/projects/:id", partnerController.getProject);
router.patch("/projects/:id/notes", partnerController.updateProjectNotes);
router.post("/projects/:id/files", upload.single("file"), partnerController.uploadProjectFile);
router.post("/projects/:id/timeline", partnerController.addTimelineEvent);

// Admin partner pages use these read-only aggregate endpoints.
router.get("/admin/partners", rbac(["admin", "super_user"]), partnerController.getPartners);
router.get("/admin/partners/:id", rbac(["admin", "super_user"]), partnerController.getPartnerDetail);

module.exports = router;
