const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const { getMyTeam, getTeamMember } = require("../controllers/managerController");

// All manager portal routes require authentication and the manager role.
router.use(authMiddleware);
router.use(rbac(["manager"]));

// GET /api/manager/team — list all subordinates of the authenticated manager
router.get("/team", getMyTeam);

// GET /api/manager/team/:userId — read-only profile of a specific subordinate
router.get("/team/:userId", getTeamMember);

module.exports = router;
