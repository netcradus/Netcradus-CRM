const Column = require("../models/Column");

// GET all columns
exports.getColumns = async (req, res) => {
  try {
    const columns = await Column.find().sort({ createdAt: 1 });
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE column
exports.createColumn = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    const column = new Column({ name: name.trim(), color });
    await column.save();
    res.json(column);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE (rename) column  ← NEW
exports.updateColumn = async (req, res) => {
  try {
    const { name, color } = req.body;
    const updates = {};
    if (name?.trim()) updates.name  = name.trim();
    if (color)        updates.color = color;

    const updated = await Column.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Column not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE column
exports.deleteColumn = async (req, res) => {
  try {
    const deleted = await Column.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Column not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};