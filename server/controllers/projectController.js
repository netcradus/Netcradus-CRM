const Project = require("../models/Project");

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("columnId");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create project
exports.createProject = async (req, res) => {
  try {
    const project = new Project(req.body); // includes columnId
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProjectColumn = async (req, res) => {
  try {
    const { columnId } = req.body;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { columnId },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};