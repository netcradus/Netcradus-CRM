const AudienceSegment = require("../models/AudienceSegment");
const UtmLink = require("../models/UtmLink");
const {
  ensureOwnership,
  getScopedQuery,
} = require("../utils/digitalMediaAccess");

exports.getSegments = async (req, res) => {
  try {
    const segments = await AudienceSegment.find(getScopedQuery(req, "createdBy", {}, false)).sort({ createdAt: -1 });
    res.json(segments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audience segments" });
  }
};

exports.createSegment = async (req, res) => {
  try {
    const segment = await AudienceSegment.create({
      name: req.body.name,
      description: req.body.description || "",
      estimatedSize: Number(req.body.estimatedSize) || 0,
      channel: req.body.channel,
      createdBy: req.user._id,
    });

    res.status(201).json(segment);
  } catch (error) {
    res.status(400).json({ message: "Failed to create audience segment" });
  }
};

exports.deleteSegment = async (req, res) => {
  try {
    const segment = await AudienceSegment.findById(req.params.id);
    const access = ensureOwnership(segment, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    await AudienceSegment.findByIdAndDelete(req.params.id);
    res.json({ message: "Audience segment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete audience segment" });
  }
};

exports.getUtmLinks = async (req, res) => {
  try {
    const links = await UtmLink.find(getScopedQuery(req, "createdBy", {}, false)).sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch UTM links" });
  }
};

exports.createUtmLink = async (req, res) => {
  try {
    const link = await UtmLink.create({
      destinationUrl: req.body.destinationUrl,
      utmSource: req.body.utmSource,
      utmMedium: req.body.utmMedium,
      utmCampaignName: req.body.utmCampaignName,
      utmTerm: req.body.utmTerm || "",
      utmContent: req.body.utmContent || "",
      generatedUrl: req.body.generatedUrl,
      createdBy: req.user._id,
    });

    res.status(201).json(link);
  } catch (error) {
    res.status(400).json({ message: "Failed to save UTM link" });
  }
};

exports.deleteUtmLink = async (req, res) => {
  try {
    const link = await UtmLink.findById(req.params.id);
    const access = ensureOwnership(link, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    await UtmLink.findByIdAndDelete(req.params.id);
    res.json({ message: "UTM link deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete UTM link" });
  }
};
