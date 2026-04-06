const express = require("express");
const router = express.Router();
const tasksController = require("../controllers/tasksController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/my-tasks", tasksController.getMyTasks);
router.patch("/:id/timing", tasksController.setTaskTiming);
router.patch("/:id/complete", tasksController.completeTask);
router.patch("/:id/review", tasksController.reviewTask);
router.get("/:id/comments", tasksController.getTaskComments);
router.post("/:id/comments", tasksController.addTaskComment);

router.get("/", tasksController.getTasks);
router.post("/", tasksController.createTask);
router.get("/:id", tasksController.getTaskById);
router.put("/:id", tasksController.updateTask);
router.delete("/:id", tasksController.deleteTask);

module.exports = router;
