const express = require("express");
const router = express.Router();
const tasksController = require("../controllers/tasksController");

// Routes
router.get("/", tasksController.getTasks);          // Get all tasks
router.post("/", tasksController.createTask);       // Create new task
router.get("/:id", tasksController.getTaskById);    // Get task by ID
router.put("/:id", tasksController.updateTask);     // Update task
router.delete("/:id", tasksController.deleteTask);  // Delete task

module.exports = router;
