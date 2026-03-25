const Project = require("../models/Project");
const Column  = require("../models/Column");

// GET all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("columnId");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE project
exports.createProject = async (req, res) => {
  try {
    const { name, client, deadline, progress, columnId } = req.body;

    // Derive a human-readable status from the column name
    let status = "To Do";
    if (columnId) {
      const col = await Column.findById(columnId);
      if (col) status = col.name;
    }

    const project = new Project({
      name,
      client,
      deadline: deadline || undefined,
      progress: Number(progress) || 0,
      columnId: columnId || null,
      status,
    });

    await project.save();

    // Return populated so frontend gets columnId as object
    const populated = await Project.findById(project._id).populate("columnId");
    res.json(populated);
  } catch (err) {
    console.error("createProject error:", err);
    res.status(500).json({ error: err.message });
  }
};

// MOVE project to different column (drag & drop)
exports.updateProjectColumn = async (req, res) => {
  try {
    const { columnId } = req.body;

    let status = "To Do";
    if (columnId) {
      const col = await Column.findById(columnId);
      if (col) status = col.name;
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { columnId, status },
      { new: true }
    ).populate("columnId");

    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateProjectColumn error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE project
exports.deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteProject error:", err);
    res.status(500).json({ error: err.message });
  }
};