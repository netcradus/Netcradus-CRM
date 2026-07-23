const express = require("express");
const {
  getMeetingReminders,
  createMeetingReminder,
  deleteMeetingReminder,
} = require("../controllers/meetingReminderController");

const router = express.Router();

router.get("/", getMeetingReminders);
router.post("/", createMeetingReminder);
router.delete("/:id", deleteMeetingReminder);

module.exports = router;
