const MeetingReminder = require("../models/MeetingReminder");

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const ensureSuperUser = (req, res) => {
  if (normalizeRole(req.user?.role) === "super_user") {
    return true;
  }

  res.status(403).json({
    success: false,
    message: "Only super admins can manage meeting reminders.",
  });
  return false;
};

exports.getMeetingReminders = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const reminders = await MeetingReminder.find({ createdBy: req.user._id })
      .sort({ meetingAt: 1 })
      .limit(20)
      .lean();

    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error("Get Meeting Reminders Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch meeting reminders", error: error.message });
  }
};

exports.createMeetingReminder = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const title = String(req.body.title || "").trim();
    const meetingLink = String(req.body.meetingLink || "").trim();
    const meetingAt = new Date(req.body.meetingAt);

    if (!title || !meetingLink || Number.isNaN(meetingAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Meeting title, link, date, and time are required.",
      });
    }

    if (meetingAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Meeting time must be in the future.",
      });
    }

    const reminder = await MeetingReminder.create({
      title,
      meetingLink,
      meetingAt,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    console.error("Create Meeting Reminder Error:", error);
    res.status(500).json({ success: false, message: "Failed to create meeting reminder", error: error.message });
  }
};

exports.deleteMeetingReminder = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const reminder = await MeetingReminder.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    }).lean();

    if (!reminder) {
      return res.status(404).json({ success: false, message: "Meeting reminder not found" });
    }

    res.json({ success: true, message: "Meeting reminder deleted" });
  } catch (error) {
    console.error("Delete Meeting Reminder Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete meeting reminder", error: error.message });
  }
};
