const express = require("express");
const router = express.Router();
const teamMeetingController = require("../controllers/teamMeetingController");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");

// Standard rate limiters can be applied here if needed, but for simplicity
// and robustness, we enforce authentication and role limits for the manager role.
router.use(authMiddleware);
router.use(rbac(["manager"]));

router.get("/", teamMeetingController.getMeetings);
router.post("/", teamMeetingController.createMeeting);
router.get("/:meetingId", teamMeetingController.getMeeting);
router.patch("/:meetingId", teamMeetingController.updateMeeting);
router.patch("/:meetingId/cancel", teamMeetingController.cancelMeeting);

module.exports = router;
