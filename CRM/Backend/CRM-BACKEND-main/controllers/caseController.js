const Case = require("../models/Case");

// ✅ Get all cases
exports.getCases = async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ✅ Get a single case
exports.getCase = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ msg: "Case not found" });
    res.json(singleCase);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ✅ Create new case
exports.createCase = async (req, res) => {
  try {
    const { caseId, title, assignedTo, status } = req.body;
    const newCase = new Case({ caseId, title, assignedTo, status });
    const savedCase = await newCase.save();
    res.json(savedCase);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ✅ Update case
exports.updateCase = async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCase) return res.status(404).json({ msg: "Case not found" });
    res.json(updatedCase);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ✅ Delete case
exports.deleteCase = async (req, res) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(req.params.id);
    if (!deletedCase) return res.status(404).json({ msg: "Case not found" });
    res.json({ msg: "Case deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
