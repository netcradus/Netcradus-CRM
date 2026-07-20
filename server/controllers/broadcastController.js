const Broadcast = require("../models/Broadcast");
const User = require("../models/User");
const { createNotifications } = require("../services/taskNotificationService");

// 1. Create Broadcast
const createBroadcast = async (req, res) => {
  try {
    const { title, content, priority, targetType, targetDepartments, targetRoles, targetUserIds } = req.body;

    // Validation
    const trimmedTitle = String(title || "").trim();
    const trimmedContent = String(content || "").trim();

    if (!trimmedTitle || trimmedTitle.length > 150) {
      return res.status(400).json({ success: false, message: "Title is required and must be under 150 characters." });
    }

    if (!trimmedContent || trimmedContent.length > 5000) {
      return res.status(400).json({ success: false, message: "Content is required and must be under 5000 characters." });
    }

    if (!["normal", "important", "urgent"].includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority level." });
    }

    if (!["all", "department", "role", "selected_users"].includes(targetType)) {
      return res.status(400).json({ success: false, message: "Invalid target type." });
    }

    let resolvedRecipientIds = [];

    // Recipient Resolution
    if (targetType === "all") {
      const activeUsers = await User.find({ isDisabled: { $ne: true }, role: { $ne: "partner" } }).select("_id").lean();
      resolvedRecipientIds = activeUsers.map(u => String(u._id));
    } else if (targetType === "department") {
      if (!Array.isArray(targetDepartments) || targetDepartments.length === 0) {
        return res.status(400).json({ success: false, message: "At least one target department must be selected." });
      }
      const activeUsers = await User.find({
        department: { $in: targetDepartments },
        isDisabled: { $ne: true },
        role: { $ne: "partner" }
      }).select("_id").lean();
      resolvedRecipientIds = activeUsers.map(u => String(u._id));
    } else if (targetType === "role") {
      if (!Array.isArray(targetRoles) || targetRoles.length === 0) {
        return res.status(400).json({ success: false, message: "At least one target role must be selected." });
      }
      const normalizedRoles = targetRoles.map(r => String(r).trim().toLowerCase());
      const activeUsers = await User.find({
        role: { $in: normalizedRoles },
        isDisabled: { $ne: true }
      }).select("_id").lean();
      resolvedRecipientIds = activeUsers.map(u => String(u._id));
    } else if (targetType === "selected_users") {
      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({ success: false, message: "At least one user must be selected." });
      }
      const activeUsers = await User.find({
        _id: { $in: targetUserIds },
        isDisabled: { $ne: true },
        role: { $ne: "partner" }
      }).select("_id").lean();
      resolvedRecipientIds = activeUsers.map(u => String(u._id));
    }

    // Exclude the author from receiving the bell notification / being in recipients list
    resolvedRecipientIds = [...new Set(resolvedRecipientIds)].filter(id => id !== String(req.user._id));

    if (resolvedRecipientIds.length === 0) {
      return res.status(400).json({ success: false, message: "No active recipients found for the selected targets." });
    }

    // Create Broadcast document
    const broadcast = new Broadcast({
      title: trimmedTitle,
      content: trimmedContent,
      priority,
      authorId: req.user._id,
      targetType,
      targetDepartments: targetType === "department" ? targetDepartments : [],
      targetRoles: targetType === "role" ? targetRoles : [],
      targetUserIds: targetType === "selected_users" ? targetUserIds : [],
      recipientUserIds: resolvedRecipientIds,
      isActive: true,
      publishedAt: new Date()
    });

    await broadcast.save();

    // Create bell notifications and trigger Socket emits
    await createNotifications({
      userIds: resolvedRecipientIds,
      message: `New announcement: ${trimmedTitle}`,
      targetPath: `/broadcasts?open=${broadcast._id}`,
      type: "announcement"
    });

    return res.status(201).json({
      success: true,
      message: "Broadcast published successfully",
      data: {
        _id: broadcast._id,
        title: broadcast.title,
        content: broadcast.content,
        priority: broadcast.priority,
        publishedAt: broadcast.publishedAt
      }
    });

  } catch (error) {
    console.error("Create Broadcast Error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish announcement", error: error.message });
  }
};

// 2. Get Broadcasts
const getBroadcasts = async (req, res) => {
  try {
    const isSuperOrHr = ["super_user", "hr"].includes(req.user.role);
    let query;

    if (isSuperOrHr) {
      // Authors see what they wrote + active announcements targeted to them
      query = {
        $or: [
          { authorId: req.user._id },
          { recipientUserIds: req.user._id, isActive: true }
        ]
      };
    } else {
      // Regular employees only see active announcements targeted to them
      query = {
        recipientUserIds: req.user._id,
        isActive: true
      };
    }

    const broadcasts = await Broadcast.find(query)
      .populate("authorId", "_id name email role")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = broadcasts.map(b => {
      const isAuthor = String(b.authorId?._id || b.authorId) === String(req.user._id);
      const showStats = isAuthor && isSuperOrHr;

      const item = {
        _id: b._id,
        title: b.title,
        contentPreview: b.content.length > 200 ? b.content.substring(0, 200) + "..." : b.content,
        priority: b.priority,
        publishedAt: b.publishedAt,
        isActive: b.isActive,
        author: b.authorId ? {
          name: b.authorId.name,
          role: b.authorId.role,
          email: b.authorId.email
        } : { name: "System" },
        isRead: b.readBy.some(id => String(id) === String(req.user._id))
      };

      if (showStats) {
        item.totalRecipients = b.recipientUserIds.length;
        item.readCount = b.readBy.length;
      }

      return item;
    });

    return res.json({ success: true, data: formatted });

  } catch (error) {
    console.error("Get Broadcasts Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch broadcasts" });
  }
};

// 3. Get Broadcast by ID
const getBroadcastById = async (req, res) => {
  try {
    const { id } = req.params;
    const broadcast = await Broadcast.findById(id)
      .populate("authorId", "_id name email role")
      .lean();

    if (!broadcast) {
      return res.status(404).json({ success: false, message: "Broadcast not found" });
    }

    const isAuthor = String(broadcast.authorId?._id || broadcast.authorId) === String(req.user._id);
    const isRecipient = broadcast.recipientUserIds.some(uid => String(uid) === String(req.user._id));
    const isSuperUser = req.user.role === "super_user";

    // Access authorization check
    if (!isAuthor && !isRecipient && !isSuperUser) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not authorized to view this broadcast" });
    }

    const isSuperOrHr = ["super_user", "hr"].includes(req.user.role);
    const showStats = isAuthor && isSuperOrHr;

    const data = {
      _id: broadcast._id,
      title: broadcast.title,
      content: broadcast.content,
      priority: broadcast.priority,
      publishedAt: broadcast.publishedAt,
      isActive: broadcast.isActive,
      author: broadcast.authorId ? {
        name: broadcast.authorId.name,
        role: broadcast.authorId.role,
        email: broadcast.authorId.email
      } : { name: "System" },
      isRead: broadcast.readBy.some(id => String(id) === String(req.user._id))
    };

    if (showStats) {
      data.targetType = broadcast.targetType;
      data.totalRecipients = broadcast.recipientUserIds.length;
      data.readCount = broadcast.readBy.length;
    }

    return res.json({ success: true, data });

  } catch (error) {
    console.error("Get Broadcast by ID Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch broadcast details" });
  }
};

// 4. Mark Broadcast as Read
const markBroadcastRead = async (req, res) => {
  try {
    const { id } = req.params;
    const broadcast = await Broadcast.findById(id);

    if (!broadcast) {
      return res.status(404).json({ success: false, message: "Broadcast not found" });
    }

    if (!broadcast.isActive) {
      return res.status(400).json({ success: false, message: "Cannot read an inactive broadcast" });
    }

    // Verify current user is a targeted recipient
    const isRecipient = broadcast.recipientUserIds.some(uid => String(uid) === String(req.user._id));
    if (!isRecipient) {
      return res.status(403).json({ success: false, message: "You are not a recipient of this broadcast" });
    }

    // Add to readBy array idempotently
    if (!broadcast.readBy.some(uid => String(uid) === String(req.user._id))) {
      broadcast.readBy.push(req.user._id);
      await broadcast.save();
    }

    return res.json({
      success: true,
      data: {
        isRead: true,
        readCount: broadcast.readBy.length
      }
    });

  } catch (error) {
    console.error("Mark Broadcast Read Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update read state" });
  }
};

module.exports = {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  markBroadcastRead
};
