const Deal = require("../models/Deal");

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const ensureSuperUser = (req, res) => {
  if (normalizeRole(req.user?.role) === "super_user") {
    return true;
  }

  res.status(403).json({
    success: false,
    message: "Only super users can access deals.",
  });
  return false;
};

exports.getDeals = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json({ success: true, data: deals });
  } catch (error) {
    console.error("Get Deals Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching deals", error: error.message });
  }
};

exports.getDeal = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }
    res.json({ success: true, data: deal });
  } catch (error) {
    console.error("Get Deal Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching deal", error: error.message });
  }
};

exports.createDeal = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const { name, status, value, assignedTo, expectedCloseDate, sourceLead } = req.body;
    const newDeal = new Deal({ name, status, value, assignedTo, expectedCloseDate, sourceLead });
    const savedDeal = await newDeal.save();
    res.status(201).json({ success: true, data: savedDeal });
  } catch (error) {
    console.error("Create Deal Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while creating deal", error: error.message });
  }
};

exports.updateDeal = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }
    res.json({ success: true, data: deal });
  } catch (error) {
    console.error("Update Deal Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while updating deal", error: error.message });
  }
};

exports.deleteDeal = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }
    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Delete Deal Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while deleting deal", error: error.message });
  }
};
