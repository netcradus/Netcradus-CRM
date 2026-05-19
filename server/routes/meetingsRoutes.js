const express = require("express");

const meetingsController = require("../controllers/meetingsController");

const router = express.Router();

router.get("/", meetingsController.getMeetings);
router.get("/:leadId", meetingsController.getMeetingDetail);
router.patch("/:leadId/outcome", meetingsController.updateMeetingOutcome);
router.post("/:leadId/note", meetingsController.addMeetingNote);

module.exports = router;
