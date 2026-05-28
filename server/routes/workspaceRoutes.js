const express = require("express");
const router = express.Router();
const StickyNote = require("../models/StickyNote");
const WorkspaceTask = require("../models/WorkspaceTask");
 
const requireSuperUser = (req, res, next) => {
  if (req.user && req.user.role === "super_user") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Forbidden: Super User access required" });
  }
};
 
router.use(requireSuperUser);
 
router.get("/notes", async (req, res) => {
  try {
    const notes = await StickyNote.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notes" });
  }
});
 
router.post("/notes", async (req, res) => {
  try {
    const { content, color } = req.body;
    const note = new StickyNote({ userId: req.user._id, content, color });
    await note.save();
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating note" });
  }
});
 
router.patch("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, color } = req.body;
    const note = await StickyNote.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { content, color } },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(403).json({ success: false, message: "Note not found or unauthorized" });
    }
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error updating note" });
  }
});
 
router.delete("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await StickyNote.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!note) {
      return res.status(403).json({ success: false, message: "Note not found or unauthorized" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error deleting note" });
  }
});
 
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await WorkspaceTask.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
});
 
router.post("/tasks", async (req, res) => {
  try {
    const { label } = req.body;
    const task = new WorkspaceTask({ userId: req.user._id, label });
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating task" });
  }
});
 
router.patch("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { label, completed } = req.body;
    const updates = {};
    if (label !== undefined) updates.label = label;
    if (completed !== undefined) updates.completed = completed;
   
    const task = await WorkspaceTask.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(403).json({ success: false, message: "Task not found or unauthorized" });
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error updating task" });
  }
});
 
router.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await WorkspaceTask.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!task) {
      return res.status(403).json({ success: false, message: "Task not found or unauthorized" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error deleting task" });
  }
});
 
module.exports = router;
 
 