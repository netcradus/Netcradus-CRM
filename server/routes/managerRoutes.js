const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const {
  getMyTeam,
  getTeamMember,
  getDashboardSummary,
  getManagerProjects,
  createManagerProject,
  getManagerProjectDetails,
  updateManagerProject,
  getManagerAttendance,
  getManagerPendingLeaves,
  getManagerLeaveDetails,
  approveManagerLeave,
  rejectManagerLeave
} = require("../controllers/managerController");

// All manager portal routes require authentication and the manager role.
router.use(authMiddleware);
router.use(rbac(["manager"]));

// GET /api/manager/dashboard — get dashboard operational summary metrics
router.get("/dashboard", getDashboardSummary);

// GET /api/manager/team — list all subordinates of the authenticated manager
router.get("/team", getMyTeam);

// GET /api/manager/team/:userId — read-only profile of a specific subordinate
router.get("/team/:userId", getTeamMember);

// Manager Attendance endpoint
router.get("/attendance", getManagerAttendance);

// Manager Projects endpoints
router.get("/projects", getManagerProjects);
router.post("/projects", createManagerProject);
router.get("/projects/:projectId", getManagerProjectDetails);
router.patch("/projects/:projectId", updateManagerProject);

// Manager Leaves endpoints
router.get("/leaves/pending", getManagerPendingLeaves);
router.get("/leaves/:leaveId", getManagerLeaveDetails);
router.patch("/leaves/:leaveId/approve", approveManagerLeave);
router.patch("/leaves/:leaveId/reject", rejectManagerLeave);

module.exports = router;
