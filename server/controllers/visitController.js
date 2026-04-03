import Visit from "../models/Visit.js";

// GET all visits
export const getVisits = async (req, res) => {
  const visits = await Visit.find().sort({ date: -1 });
  res.json(visits);
};

// ADD visit
export const addVisit = async (req, res) => {
  const visit = new Visit(req.body);
  const saved = await visit.save();
  res.json(saved);
};

// UPDATE visit (Reschedule / edit)
export const updateVisit = async (req, res) => {
  const updated = await Visit.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

// DELETE visit
export const deleteVisit = async (req, res) => {
  await Visit.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

// GET single visit (View)
export const getVisitById = async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  res.json(visit);
};