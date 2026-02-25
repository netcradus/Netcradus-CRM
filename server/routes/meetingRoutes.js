
const express = require("express");
const router = express.Router();
const meetingsController = require("../controllers/meetingsController");

// Routes
router.get("/", meetingsController.getMeetings);        // Get all meetings
router.get("/:id", meetingsController.getMeeting);      // Get single meeting by ID
router.post("/", meetingsController.createMeeting);     // Create a new meeting
router.put("/:id", meetingsController.updateMeeting);   // Update a meeting
router.delete("/:id", meetingsController.deleteMeeting);// Delete a meeting

module.exports = router;
