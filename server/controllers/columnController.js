const Column = require("../models/Column");

// GET all columns
exports.getColumns = async (req, res) => {
  try {
    const columns = await Column.find();
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE column
exports.createColumn = async (req, res) => {
  try {
    const column = new Column(req.body);
    await column.save();
    res.json(column);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE column
exports.deleteColumn = async (req, res) => {
  try {
    await Column.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};