const Solution = require("../models/Solution");

// ✅ Get all solutions (with optional status filter: /api/solutions?status=Pending)
exports.getSolutions = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== "All") query.status = status;

    const solutions = await Solution.find(query).sort({ createdAt: -1 });
    res.json(solutions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Get a single solution
exports.getSolution = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) return res.status(404).json({ message: "Solution not found" });
    res.json(solution);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Create a new solution
exports.createSolution = async (req, res) => {
  try {
    const { title, client, date, status, notes } = req.body;
    const newSolution = new Solution({ title, client, date, status, notes });
    const savedSolution = await newSolution.save();
    res.json(savedSolution);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Update a solution
exports.updateSolution = async (req, res) => {
  try {
    const solution = await Solution.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!solution) return res.status(404).json({ message: "Solution not found" });
    res.json(solution);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Delete a solution
exports.deleteSolution = async (req, res) => {
  try {
    const solution = await Solution.findByIdAndDelete(req.params.id);
    if (!solution) return res.status(404).json({ message: "Solution not found" });
    res.json({ message: "Solution deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
