const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { getPresenceForUsers } = require("../socket");
const { buildConversationSummary, normalizeMessage } = require("../utils/chatSerializers");

const MESSAGE_LIMIT_DEFAULT = 50;

async function ensureConversationMember(conversationId, userId) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;

  return Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });
}

async function getConversations(req, res) {
  try {
    const currentUserId = req.user._id;
    const conversations = await Conversation.find({
      participants: currentUserId,
      hiddenFor: { $ne: currentUserId },
    })
      .populate("participants", "_id name email role department lastSeenAt")
      .populate({
        path: "lastMessageId",
        populate: { path: "senderId", select: "_id name email" },
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const conversationIds = conversations.map((conversation) => conversation._id);
    const unreadCounts = conversationIds.length
      ? await Message.aggregate([
          {
            $match: {
              conversationId: { $in: conversationIds },
              senderId: { $ne: currentUserId },
              isRead: false,
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: "$conversationId",
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    const unreadCountMap = unreadCounts.reduce((accumulator, item) => {
      accumulator[String(item._id)] = item.count;
      return accumulator;
    }, {});

    const userIds = conversations.flatMap((conversation) =>
      (conversation.participants || []).map((participant) => String(participant._id))
    );
    const presenceMap = getPresenceForUsers(userIds);

    const data = conversations.map((conversation) =>
      buildConversationSummary(
        conversation,
        currentUserId,
        unreadCountMap[String(conversation._id)] || 0,
        presenceMap
      )
    );

    return res.json({
      success: true,
      data,
      unreadCount: data.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
}

async function getConversationMessages(req, res) {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || MESSAGE_LIMIT_DEFAULT, 100);

    const conversation = await ensureConversationMember(id, currentUserId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const total = await Message.countDocuments({ conversationId: id });
    const messages = await Message.find({ conversationId: id })
      .populate("senderId", "_id name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: messages.reverse().map(normalizeMessage),
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
}

async function createConversation(req, res) {
  try {
    const currentUserId = String(req.user._id);
    const { participantId } = req.body;

    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ success: false, message: "A valid participant is required" });
    }

    if (String(participantId) === currentUserId) {
      return res.status(400).json({ success: false, message: "You cannot create a chat with yourself" });
    }

    const participant = await User.findOne({
      _id: participantId,
      isDisabled: { $ne: true },
    }).select("_id name email role department lastSeenAt");

    if (!participant) {
      return res.status(404).json({ success: false, message: "Selected user was not found" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    })
      .populate("participants", "_id name email role department lastSeenAt")
      .populate({
        path: "lastMessageId",
        populate: { path: "senderId", select: "_id name email" },
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, participantId],
        lastMessageAt: new Date(),
        hiddenFor: [],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "_id name email role department lastSeenAt")
        .populate({
          path: "lastMessageId",
          populate: { path: "senderId", select: "_id name email" },
        });
    }
    if (conversation.hiddenFor?.length) {
      conversation.hiddenFor = conversation.hiddenFor.filter(
        (userId) => String(userId) !== currentUserId
      );
      await conversation.save();
      await conversation.populate("participants", "_id name email role department lastSeenAt");
      await conversation.populate({
        path: "lastMessageId",
        populate: { path: "senderId", select: "_id name email" },
      });
    }

    const presenceMap = getPresenceForUsers([currentUserId, participantId]);

    return res.status(201).json({
      success: true,
      data: buildConversationSummary(conversation.toObject(), currentUserId, 0, presenceMap),
    });
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create conversation" });
  }
}

async function hideConversation(req, res) {
  try {
    const conversation = await ensureConversationMember(req.params.id, req.user._id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const alreadyHidden = (conversation.hiddenFor || []).some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (!alreadyHidden) {
      conversation.hiddenFor = [...(conversation.hiddenFor || []), req.user._id];
      await conversation.save();
    }

    return res.json({
      success: true,
      data: {
        _id: String(conversation._id),
        hiddenForUserId: String(req.user._id),
      },
    });
  } catch (error) {
    console.error("Hide Conversation Error:", error);
    return res.status(500).json({ success: false, message: "Failed to hide conversation" });
  }
}

async function editMessage(req, res) {
  try {
    const { id } = req.params;
    const { messageText } = req.body;
    const trimmedMessage = String(messageText || "").trim();

    if (!trimmedMessage) {
      return res.status(400).json({ success: false, message: "Message text is required" });
    }

    const message = await Message.findOne({
      _id: id,
      senderId: req.user._id,
      isDeleted: false,
    }).populate("senderId", "_id name email");

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.messageText = trimmedMessage;
    message.editedAt = new Date();
    await message.save();

    return res.json({ success: true, data: normalizeMessage(message.toObject()) });
  } catch (error) {
    console.error("Edit Message Error:", error);
    return res.status(500).json({ success: false, message: "Failed to edit message" });
  }
}

async function deleteMessage(req, res) {
  try {
    const { id } = req.params;
    const message = await Message.findOne({
      _id: id,
      senderId: req.user._id,
      isDeleted: false,
    });

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.messageText = "This message was deleted.";
    await message.save();

    return res.json({
      success: true,
      data: {
        _id: String(message._id),
        conversationId: String(message.conversationId),
        deletedAt: message.deletedAt,
        isDeleted: true,
      },
    });
  } catch (error) {
    console.error("Delete Message Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete message" });
  }
}

async function getOnlineStatus(req, res) {
  try {
    const ids = String(req.query.userIds || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const userIds = ids.length
      ? ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).slice(0, 50)
      : (
          await Conversation.find({ participants: req.user._id })
            .select("participants")
            .maxTimeMS(2000)
            .lean()
        ).flatMap((conversation) => conversation.participants.map(String));

    const uniqueUserIds = [...new Set(userIds.filter((userId) => userId !== String(req.user._id)))];
    const presenceMap = getPresenceForUsers(uniqueUserIds);

    if (ids.length) {
      return res.json({
        success: true,
        data: uniqueUserIds.map((userId) => ({
          userId,
          isOnline: Boolean(presenceMap[userId]?.isOnline),
          lastSeen: presenceMap[userId]?.lastSeen || null,
        })),
      });
    }

    const users = await User.find({ _id: { $in: uniqueUserIds } })
      .select("_id lastSeenAt")
      .maxTimeMS(2000)
      .lean();
    const lastSeenMap = users.reduce((acc, user) => {
      acc[String(user._id)] = user.lastSeenAt || null;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: uniqueUserIds.map((userId) => ({
        userId,
        isOnline: Boolean(presenceMap[userId]?.isOnline),
        lastSeen: presenceMap[userId]?.lastSeen || lastSeenMap[userId] || null,
      })),
    });
  } catch (error) {
    console.error("Get Online Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch online status" });
  }
}

async function getChatDirectory(req, res) {
  try {
    const query = String(req.query.search || "").trim();
    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { department: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({
      _id: { $ne: req.user._id },
      isDisabled: { $ne: true },
      ...searchFilter,
    })
      .select("_id name email role department lastSeenAt")
      .sort({ name: 1 })
      .limit(50)
      .lean();

    const presenceMap = getPresenceForUsers(users.map((user) => String(user._id)));

    return res.json({
      success: true,
      data: users.map((user) => ({
        _id: String(user._id),
        name: user.name || user.email || "User",
        email: user.email || "",
        role: user.role || "",
        department: user.department || "",
        lastSeenAt: user.lastSeenAt || null,
        isOnline: Boolean(presenceMap[String(user._id)]?.isOnline),
      })),
    });
  } catch (error) {
    console.error("Get Chat Directory Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user directory" });
  }
}

module.exports = {
  buildConversationSummary,
  createConversation,
  deleteMessage,
  editMessage,
  ensureConversationMember,
  getChatDirectory,
  getConversationMessages,
  getConversations,
  getOnlineStatus,
  hideConversation,
  normalizeMessage,
};
