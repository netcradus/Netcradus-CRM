const Campaign = require("../models/Campaign");
const {
  ensureOwnership,
  getScopedQuery,
  isPrivilegedUser,
} = require("../utils/digitalMediaAccess");

const buildDateRangeQuery = (from, to) => {
  if (!from && !to) {
    return {};
  }

  const range = {};

  if (from) {
    range.$gte = new Date(from);
  }

  if (to) {
    range.$lte = new Date(to);
  }

  return {
    startDate: { $lte: range.$lte || new Date("9999-12-31T23:59:59.999Z") },
    endDate: { $gte: range.$gte || new Date("1970-01-01T00:00:00.000Z") },
  };
};

exports.getCampaigns = async (req, res) => {
  try {
    const dateQuery = buildDateRangeQuery(req.query.from, req.query.to);
    const campaigns = await Campaign.find(getScopedQuery(req, "createdBy", dateQuery)).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    const access = ensureOwnership(campaign, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
};

exports.addCampaign = async (req, res) => {
  try {
    const {
      name,
      channel,
      status,
      startDate,
      endDate,
      budgetAllocated,
      budgetSpent,
    } = req.body;

    const savedCampaign = await Campaign.create({
      name,
      channel,
      status,
      startDate,
      endDate,
      budgetAllocated: Number(budgetAllocated) || 0,
      budgetSpent: Number(budgetSpent) || 0,
      createdBy: req.user._id,
      approvalStatus: "draft",
      approvalReason: "",
      approvedBy: null,
      approvedAt: null,
      submittedAt: null,
    });

    res.status(201).json(savedCampaign);
  } catch (error) {
    res.status(400).json({ message: "Failed to create campaign" });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    const access = ensureOwnership(campaign, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const updates = {
      name: req.body.name ?? campaign.name,
      channel: req.body.channel ?? campaign.channel,
      status: req.body.status ?? campaign.status,
      startDate: req.body.startDate ?? campaign.startDate,
      endDate: req.body.endDate ?? campaign.endDate,
      budgetAllocated: req.body.budgetAllocated ?? campaign.budgetAllocated,
      budgetSpent: req.body.budgetSpent ?? campaign.budgetSpent,
    };

    if (!isPrivilegedUser(req.user) && campaign.approvalStatus === "rejected") {
      updates.approvalStatus = "draft";
      updates.approvalReason = "";
      updates.approvedBy = null;
      updates.approvedAt = null;
      updates.submittedAt = null;
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(updatedCampaign);
  } catch (error) {
    res.status(400).json({ message: "Failed to update campaign" });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    const access = ensureOwnership(campaign, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete campaign" });
  }
};

exports.updateCampaignBudget = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    const access = ensureOwnership(campaign, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    campaign.budgetAllocated = Number(req.body.budgetAllocated) || 0;
    campaign.budgetSpent = Number(req.body.budgetSpent) || 0;

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: "Failed to update budget" });
  }
};

exports.submitCampaignForReview = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    const access = ensureOwnership(campaign, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    campaign.approvalStatus = "pending_review";
    campaign.approvalReason = "";
    campaign.approvedBy = null;
    campaign.approvedAt = null;
    campaign.submittedAt = new Date();

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: "Failed to submit campaign for review" });
  }
};

exports.approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    campaign.approvalStatus = "approved";
    campaign.approvalReason = "";
    campaign.approvedBy = req.user._id;
    campaign.approvedAt = new Date();

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: "Failed to approve campaign" });
  }
};

exports.rejectCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    const approvalReason = String(req.body.approvalReason || "").trim();

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (!approvalReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    campaign.approvalStatus = "rejected";
    campaign.approvalReason = approvalReason;
    campaign.approvedBy = req.user._id;
    campaign.approvedAt = new Date();

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: "Failed to reject campaign" });
  }
};
