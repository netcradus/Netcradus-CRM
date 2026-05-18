const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const rbac = require("../middleware/rbac");
const { verifyPasswordLimiter, projectRouteLimiter } = require("../middleware/rateLimiter");

router.use(projectRouteLimiter);

router.get("/users", projectController.getProjectUsers);
router.get("/showcase", rbac(["super_user"]), projectController.getShowcaseProjects);
router.post("/", projectController.createProject);
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProject);
router.post("/verify-password", verifyPasswordLimiter, projectController.verifyPassword);
router.patch("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);
router.patch("/:id/sensitive", projectController.updateSensitiveFields);
router.patch("/:id/showcase", projectController.toggleShowcase);
router.patch("/:id/featured", projectController.toggleFeatured);
router.post("/:id/documents", projectController.attachDocument);
router.delete("/:id/documents/:driveFileId", projectController.removeDocument);

module.exports = router;
