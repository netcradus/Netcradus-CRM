const express = require("express");
const router = express.Router();
const projectController = require("../controllers/ProjectController");

router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);
router.put("/:id/move", projectController.updateProjectColumn);

router.delete("/:id", projectController.deleteProject);

module.exports = router;