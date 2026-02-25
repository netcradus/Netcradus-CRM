// campaignController.js
const Campaign = require("../models/Campaign");

// Get all campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get a campaign by ID
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Create a new campaign
exports.addCampaign = async (req, res) => {
  try {
    const { name, channel, status, startDate, endDate } = req.body;
    const newCampaign = new Campaign({
      name,
      channel,
      status,
      startDate,
      endDate,
    });
    const savedCampaign = await newCampaign.save();
    res.json(savedCampaign);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update a campaign
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete a campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    res.json({ message: "Campaign deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
