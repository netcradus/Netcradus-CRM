const Campaign = require("../models/Campaign");
const SocialPost = require("../models/SocialPost");

exports.getApprovalQueue = async (req, res) => {
  try {
    const [campaigns, posts] = await Promise.all([
      Campaign.find({ approvalStatus: "pending_review" })
        .populate("createdBy", "name email")
        .sort({ submittedAt: -1 }),
      SocialPost.find({ approvalStatus: "pending_review" })
        .populate("userId", "name email")
        .sort({ submittedAt: -1 }),
    ]);

    const queue = [
      ...campaigns.map((campaign) => ({
        _id: campaign._id,
        itemType: "campaign",
        preview: campaign.name,
        submittedAt: campaign.submittedAt || campaign.updatedAt || campaign.createdAt,
        submitterName: campaign.createdBy?.name || campaign.createdBy?.email || "Unknown user",
        approvalStatus: campaign.approvalStatus,
      })),
      ...posts.map((post) => ({
        _id: post._id,
        itemType: "post",
        preview: post.content,
        submittedAt: post.submittedAt || post.updatedAt || post.createdAt,
        submitterName: post.userId?.name || post.userId?.email || "Unknown user",
        approvalStatus: post.approvalStatus,
      })),
    ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch approval queue" });
  }
};
