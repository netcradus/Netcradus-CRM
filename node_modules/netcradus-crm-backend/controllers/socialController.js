const Campaign = require("../models/Campaign");
const SocialConnection = require("../models/SocialConnection");
const SocialInboxItem = require("../models/SocialInboxItem");
const SocialPost = require("../models/SocialPost");
const {
  ensureOwnership,
  getScopedQuery,
} = require("../utils/digitalMediaAccess");

const PLATFORM_NAMES = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
  whatsapp_business: "WhatsApp Business",
};

const buildInboxSeedItems = (userId) => [
  {
    platform: "facebook",
    senderName: "Aarav Mehta",
    message: "Can you share the registration link for the summer growth webinar campaign?",
    timestamp: new Date("2026-05-10T09:15:00.000Z"),
    status: "new",
    userId,
  },
  {
    platform: "instagram",
    senderName: "Studio Nineteen",
    message: "We loved the new carousel. Do you have a version sized for stories as well?",
    timestamp: new Date("2026-05-10T11:40:00.000Z"),
    status: "new",
    userId,
  },
  {
    platform: "x",
    senderName: "Ritika Shah",
    message: "Tagging your team here because the campaign landing page is loading well now.",
    timestamp: new Date("2026-05-10T14:05:00.000Z"),
    status: "read",
    userId,
  },
  {
    platform: "linkedin",
    senderName: "Venture Axis",
    message: "Interested in partnering on the leadership series you promoted this week.",
    timestamp: new Date("2026-05-10T16:25:00.000Z"),
    status: "new",
    userId,
  },
  {
    platform: "whatsapp_business",
    senderName: "Karan Verma",
    message: "Please confirm whether tomorrow's reminder creative is final.",
    timestamp: new Date("2026-05-11T05:50:00.000Z"),
    status: "read",
    userId,
  },
  {
    platform: "facebook",
    senderName: "Nexa Retail",
    message: "The boosted post is drawing solid responses. Can we extend it by two more days?",
    timestamp: new Date("2026-05-11T08:35:00.000Z"),
    status: "new",
    userId,
  },
  {
    platform: "instagram",
    senderName: "Brand Harbor",
    message: "Mentioning you in our recap because your campaign visuals stood out today.",
    timestamp: new Date("2026-05-11T10:20:00.000Z"),
    status: "replied",
    replyText: "Thanks for the mention. Happy to collaborate on the recap thread.",
    repliedAt: new Date("2026-05-11T10:45:00.000Z"),
    userId,
  },
  {
    platform: "linkedin",
    senderName: "Priya Nair",
    message: "Can someone from marketing reach out about enterprise pricing?",
    timestamp: new Date("2026-05-11T13:10:00.000Z"),
    status: "new",
    userId,
  },
  {
    platform: "x",
    senderName: "Campaign Watch",
    message: "You were mentioned in a thread comparing the top B2B launch campaigns this month.",
    timestamp: new Date("2026-05-11T18:00:00.000Z"),
    status: "new",
    userId,
  },
  {
    platform: "whatsapp_business",
    senderName: "Maya Singh",
    message: "Following up on the promo code issue from yesterday's ad sequence.",
    timestamp: new Date("2026-05-12T04:30:00.000Z"),
    status: "new",
    userId,
  },
];

const ensureInboxSeed = async (userId) => {
  const existingCount = await SocialInboxItem.countDocuments({ userId });
  if (existingCount > 0) {
    return;
  }

  const seedItems = buildInboxSeedItems(userId);

  await Promise.all(
    seedItems.map((item) =>
      SocialInboxItem.updateOne(
        { userId, platform: item.platform, senderName: item.senderName, timestamp: item.timestamp },
        { $setOnInsert: item },
        { upsert: true }
      )
    )
  );
};

exports.getConnections = async (req, res) => {
  try {
    const connections = await SocialConnection.find(getScopedQuery(req, "userId", {}, false)).sort({ createdAt: -1 });
    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch connections" });
  }
};

exports.connectPlatform = async (req, res) => {
  try {
    const platform = String(req.body.platform || "").trim().toLowerCase();
    const accountName = String(req.body.accountName || "").trim();
    const accessToken = String(req.body.accessToken || "").trim();

    if (!platform || !accountName || !accessToken) {
      return res.status(400).json({ message: "Platform, account name, and access token are required" });
    }

    const connection = await SocialConnection.findOneAndUpdate(
      { platform, userId: req.user._id },
      {
        platform,
        accountName,
        accessToken,
        userId: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(connection);
  } catch (error) {
    res.status(400).json({ message: "Failed to save social connection" });
  }
};

exports.disconnectPlatform = async (req, res) => {
  try {
    await SocialConnection.findOneAndDelete({
      platform: String(req.params.platform || "").trim().toLowerCase(),
      userId: req.user._id,
    });

    res.json({ message: "Platform disconnected" });
  } catch (error) {
    res.status(500).json({ message: "Failed to disconnect platform" });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const query = getScopedQuery(req, "userId", {}, false);

    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    if (req.query.platform) {
      query.platforms = req.query.platform;
    }

    if (req.query.from || req.query.to) {
      query.scheduledAt = {};
      if (req.query.from) {
        query.scheduledAt.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        query.scheduledAt.$lte = new Date(req.query.to);
      }
    }

    const posts = await SocialPost.find(query).sort({ scheduledAt: 1, createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const action = req.body.action === "post_now" ? "post_now" : "schedule";
    const payload = {
      content: req.body.content,
      platforms: Array.isArray(req.body.platforms) ? req.body.platforms : [],
      scheduledAt: req.body.scheduledAt || null,
      postedAt: action === "post_now" ? new Date() : null,
      status: action === "post_now" ? "posted" : req.body.scheduledAt ? "scheduled" : "draft",
      mediaUrl: req.body.mediaUrl || "",
      userId: req.user._id,
      approvalStatus: "draft",
      approvalReason: "",
      approvedBy: null,
      approvedAt: null,
      submittedAt: null,
    };

    const post = await SocialPost.create(payload);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: "Failed to create post" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    const access = ensureOwnership(post, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    post.content = req.body.content ?? post.content;
    post.platforms = Array.isArray(req.body.platforms) ? req.body.platforms : post.platforms;
    post.scheduledAt = req.body.scheduledAt ?? post.scheduledAt;
    post.mediaUrl = req.body.mediaUrl ?? post.mediaUrl;
    post.status = req.body.action === "post_now"
      ? "posted"
      : req.body.scheduledAt
        ? "scheduled"
        : req.body.status ?? post.status;

    if (req.body.action === "post_now") {
      post.postedAt = new Date();
    }

    if (post.approvalStatus === "rejected") {
      post.approvalStatus = "draft";
      post.approvalReason = "";
      post.approvedBy = null;
      post.approvedAt = null;
      post.submittedAt = null;
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Failed to update post" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    const access = ensureOwnership(post, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    await SocialPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post" });
  }
};

exports.submitPostForReview = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    const access = ensureOwnership(post, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    post.approvalStatus = "pending_review";
    post.approvalReason = "";
    post.approvedBy = null;
    post.approvedAt = null;
    post.submittedAt = new Date();

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Failed to submit post for review" });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.approvalStatus = "approved";
    post.approvalReason = "";
    post.approvedBy = req.user._id;
    post.approvedAt = new Date();

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Failed to approve post" });
  }
};

exports.rejectPost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    const approvalReason = String(req.body.approvalReason || "").trim();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!approvalReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    post.approvalStatus = "rejected";
    post.approvalReason = approvalReason;
    post.approvedBy = req.user._id;
    post.approvedAt = new Date();

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Failed to reject post" });
  }
};

exports.getInboxItems = async (req, res) => {
  try {
    await ensureInboxSeed(req.user._id);

    const query = getScopedQuery(req, "userId", {}, false);

    if (req.query.platform && req.query.platform !== "all") {
      query.platform = req.query.platform;
    }

    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    const items = await SocialInboxItem.find(query)
      .populate("campaignId", "name")
      .sort({ timestamp: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inbox items" });
  }
};

exports.markInboxItemRead = async (req, res) => {
  try {
    const item = await SocialInboxItem.findById(req.params.id);
    const access = ensureOwnership(item, req);

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    item.status = item.status === "replied" ? "replied" : "read";
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: "Failed to update inbox item" });
  }
};

exports.replyToInboxItem = async (req, res) => {
  try {
    const item = await SocialInboxItem.findById(req.params.id);
    const access = ensureOwnership(item, req);
    const replyText = String(req.body.replyText || "").trim();

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    if (!replyText) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    item.replyText = replyText;
    item.status = "replied";
    item.repliedAt = new Date();

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: "Failed to save reply" });
  }
};

exports.getPlatformMetadata = () =>
  Object.entries(PLATFORM_NAMES).map(([value, label]) => ({
    value,
    label,
    oauthUrl: `https://oauth.placeholder.netcradus.local/${value}`,
  }));
