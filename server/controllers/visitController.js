const Visit = require("../models/Visit.js");

// GET all visits
exports.getVisits = async (req, res) => {
  const visits = await Visit.find().sort({ date: -1 });
  res.json(visits);
};

// ADD visit
exports.addVisit = async (req, res) => {
  const visit = new Visit(req.body);
  const saved = await visit.save();
  res.json(saved);
};

// UPDATE visit (Reschedule / edit)
exports.updateVisit = async (req, res) => {
  const updated = await Visit.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

// DELETE visit
exports.deleteVisit = async (req, res) => {
  await Visit.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

// GET single visit (View)
exports.getVisitById = async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  res.json(visit);
};