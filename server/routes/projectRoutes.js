const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);
router.put("/:id/move", projectController.updateProjectColumn);

router.delete("/:id", projectController.deleteProject);

router.put("/:id/description", projectController.updateDescription);
router.post("/:id/comment", projectController.addComment);

module.exports = router;