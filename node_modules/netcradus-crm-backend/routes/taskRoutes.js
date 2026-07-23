const express = require("express");
const router = express.Router();
const tasksController = require("../controllers/tasksController");

router.get("/assignable-users", tasksController.getAssignableUsers);
router.get("/my-tasks", tasksController.getMyTasks);
router.get("/queue/:userId", tasksController.getUserQueue);
router.post("/self", tasksController.createSelfTask);
router.get("/self/mine", tasksController.getMySelfTasks);
router.get("/self/pending-approvals", tasksController.getPendingApprovals);
router.post("/self/:taskId/submit", tasksController.submitSelfTaskForApproval);
router.post("/self/:taskId/approve", tasksController.approveSelfTask);
router.post("/self/:taskId/reject", tasksController.rejectSelfTask);
router.post("/self/:taskId/request-changes", tasksController.requestChangesSelfTask);
router.post("/self/:id/reviewer-note", tasksController.addReviewerNote);
router.patch("/:id/timing", tasksController.setTaskTiming);
router.patch("/:id/complete", tasksController.completeTask);
router.patch("/:id/review", tasksController.reviewTask);
router.patch("/:id", tasksController.updateTaskStatus);
router.get("/:id/comments", tasksController.getTaskComments);
router.post("/:id/comments", tasksController.addTaskComment);

router.get("/", tasksController.getTasks);
router.post("/", tasksController.createTask);
router.get("/:id", tasksController.getTaskById);
router.put("/:id", tasksController.updateTask);
router.delete("/:id", tasksController.deleteTask);

module.exports = router; // trigger restart
