const Call = require("../models/Call");

// Get all calls
exports.getCalls = async (req, res) => {
  try {
    const calls = await Call.find()
      .populate("associatedAccount", "accountName")
      .populate("associatedLead", "name");
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get call by ID
exports.getCallById = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate("associatedAccount", "accountName")
      .populate("associatedLead", "name");
    if (!call) return res.status(404).json({ message: "Call not found" });
    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new call
exports.createCall = async (req, res) => {
  try {
    const call = new Call(req.body);
    const savedCall = await call.save();
    res.status(201).json(savedCall);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update call
exports.updateCall = async (req, res) => {
  try {
    const updatedCall = await Call.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCall) return res.status(404).json({ message: "Call not found" });
    res.json(updatedCall);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete call
exports.deleteCall = async (req, res) => {
  try {
    const deletedCall = await Call.findByIdAndDelete(req.params.id);
    if (!deletedCall) return res.status(404).json({ message: "Call not found" });
    res.json({ message: "Call deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
