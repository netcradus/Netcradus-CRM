const MediaAsset = require("../models/MediaAsset");
const {
  ensureOwnership,
  getScopedQuery,
} = require("../utils/digitalMediaAccess");

exports.getMediaAssets = async (req, res) => {
  try {
    const query = getScopedQuery(req, "uploadedBy", {}, false);

    if (req.query.type && req.query.type !== "all") {
      const normalizedType = String(req.query.type).toLowerCase();
      if (normalizedType === "images") {
        query.fileType = { $regex: "^image/", $options: "i" };
      } else if (normalizedType === "videos") {
        query.fileType = { $regex: "^video/", $options: "i" };
      } else if (normalizedType === "documents") {
        query.fileType = { $not: /^image\/|^video\//i };
      }
    }

    if (req.query.search) {
      query.$or = [
        { filename: { $regex: req.query.search, $options: "i" } },
        { tags: { $elemMatch: { $regex: req.query.search, $options: "i" } } },
      ];
    }

    const assets = await MediaAsset.find(query)
      .populate("linkedCampaigns", "name")
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch media assets" });
  }
};

exports.createMediaAsset = async (req, res) => {
  try {
    const fileType = String(req.body.fileType || "application/octet-stream");
    const filename = String(req.body.filename || "").trim();
    const fileSize = Number(req.body.fileSize) || 0;
    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const asset = await MediaAsset.create({
      filename,
      url: req.body.url || `mock://media/${encodeURIComponent(filename)}`,
      fileType,
      fileSize,
      tags,
      linkedCampaigns: Array.isArray(req.body.linkedCampaigns) ? req.body.linkedCampaigns : [],
      uploadedBy: req.user._id,
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: "Failed to create media asset" });
  }
};

exports.deleteMediaAsset = async (req, res) => {
  try {
    const asset = await MediaAsset.findById(req.params.id);
    const access = ensureOwnership(asset, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    await MediaAsset.findByIdAndDelete(req.params.id);
    res.json({ message: "Media asset deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete media asset" });
  }
};

exports.linkCampaignToMedia = async (req, res) => {
  try {
    const asset = await MediaAsset.findById(req.params.id);
    const access = ensureOwnership(asset, req);
    const linkedCampaigns = Array.isArray(req.body.linkedCampaigns) ? req.body.linkedCampaigns : [];

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    asset.linkedCampaigns = linkedCampaigns;
    await asset.save();

    const populatedAsset = await MediaAsset.findById(asset._id).populate("linkedCampaigns", "name");
    res.json(populatedAsset);
  } catch (error) {
    res.status(400).json({ message: "Failed to link campaign" });
  }
};
