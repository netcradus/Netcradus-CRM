const Meeting = require("../models/Meeting");

// ✅ GET ALL
exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ createdAt: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET ONE
exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ CREATE
exports.createMeeting = async (req, res) => {
  try {
    const meeting = new Meeting(req.body);
    const saved = await meeting.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ UPDATE
exports.updateMeeting = async (req, res) => {
  try {
    const updated = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ DELETE
exports.deleteMeeting = async (req, res) => {
  try {
    const deleted = await Meeting.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ message: "Meeting deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};