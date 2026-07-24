const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { emitToUsers, getPresenceForUsers } = require("../socket");
const { buildConversationSummary, normalizeMessage } = require("../utils/chatSerializers");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MESSAGE_LIMIT_DEFAULT = 50;

function buildUnreadMessageMatch(conversationIds, currentUserId) {
  return {
    conversationId: { $in: conversationIds },
    senderId: { $ne: currentUserId },
    isDeleted: false,
    $or: [
      { readBy: { $ne: currentUserId } },
      { readBy: { $exists: false }, isRead: false },
      { readBy: { $size: 0 }, isRead: false },
    ],
  };
}

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
      .select("participants isGroup groupName createdBy hiddenFor lastMessageId lastMessageAt updatedAt")
      .populate("participants", "_id name email role department lastSeenAt")
      .populate({
        path: "lastMessageId",
        populate: { path: "senderId", select: "_id name email" },
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .maxTimeMS(3000)
      .lean();

    const conversationIds = conversations.map((conversation) => conversation._id);
    const unreadCounts = conversationIds.length
      ? await Message.aggregate([
          {
            $match: buildUnreadMessageMatch(conversationIds, currentUserId),
          },
          {
            $group: {
              _id: "$conversationId",
              count: { $sum: 1 },
            },
          },
        ])
          .option({ maxTimeMS: 3000 })
      : [];

    const unreadCountMap = unreadCounts.reduce((accumulator, item) => {
      accumulator[String(item._id)] = item.count;
      return accumulator;
    }, {});

    const userIds = conversations.flatMap((conversation) =>
      (conversation.participants || []).map((participant) => String(participant._id))
    );
    const presenceMap = getPresenceForUsers(userIds);

    const data = await Promise.all(
      conversations.map(async (conversation) => {
        let lastMsg = conversation.lastMessageId;
        const isDeletedForUser = lastMsg && 
          Array.isArray(lastMsg.deletedFor) && 
          lastMsg.deletedFor.some(d => String(d.userId) === String(currentUserId));

        if (isDeletedForUser) {
          const lastVisibleMsg = await Message.findOne({
            conversationId: conversation._id,
            "deletedFor.userId": { $ne: currentUserId }
          })
            .populate("senderId", "_id name email")
            .populate({
              path: "replyTo",
              select: "senderId messageText fileUrl fileName messageType isDeleted messageText rawMessageText",
              populate: { path: "senderId", select: "_id name email" }
            })
            .sort({ createdAt: -1 })
            .lean();
          
          conversation.lastMessageId = lastVisibleMsg;
        }

        return buildConversationSummary(
          conversation,
          currentUserId,
          unreadCountMap[String(conversation._id)] || 0,
          presenceMap
        );
      })
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

    const filter = {
      conversationId: id,
      "deletedFor.userId": { $ne: currentUserId }
    };
    const total = await Message.countDocuments(filter);
    const messages = await Message.find(filter)
      .populate("senderId", "_id name email")
      .populate({
        path: "replyTo",
        select: "senderId messageText fileUrl fileName messageType isDeleted messageText rawMessageText",
        populate: { path: "senderId", select: "_id name email" }
      })
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
    const { participantId, participantIds, groupName, isGroup } = req.body;
    const creatingGroup = Boolean(isGroup || Array.isArray(participantIds));

    if (creatingGroup) {
      const selectedParticipantIds = [...new Set((participantIds || []).map(String))]
        .filter((id) => id !== currentUserId && mongoose.Types.ObjectId.isValid(id));
      const trimmedGroupName = String(groupName || "").trim();

      if (!trimmedGroupName) {
        return res.status(400).json({ success: false, message: "Group name is required" });
      }

      if (selectedParticipantIds.length < 1) {
        return res.status(400).json({ success: false, message: "Select at least one person for a group" });
      }

      const users = await User.find({
        _id: { $in: selectedParticipantIds },
        isDisabled: { $ne: true },
      }).select("_id");

      if (users.length !== selectedParticipantIds.length) {
        return res.status(404).json({ success: false, message: "One or more selected users were not found" });
      }

      let conversation = await Conversation.create({
        participants: [currentUserId, ...selectedParticipantIds],
        isGroup: true,
        groupName: trimmedGroupName,
        createdBy: currentUserId,
        lastMessageAt: new Date(),
        hiddenFor: [],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "_id name email role department lastSeenAt")
        .populate({
          path: "lastMessageId",
          populate: { path: "senderId", select: "_id name email" },
        });

      const presenceMap = getPresenceForUsers(conversation.participants.map((participant) => String(participant._id)));
      await Promise.all(
        conversation.participants.map(async (participant) => {
          const participantId = String(participant._id);
          emitToUsers([participantId], "conversation_created", {
            conversation: buildConversationSummary(conversation.toObject(), participantId, 0, presenceMap),
          });
        })
      );

      const notifyUserIds = selectedParticipantIds.filter((userId) => userId !== currentUserId);
      if (notifyUserIds.length) {
        const { createNotifications } = require("../services/taskNotificationService");
        await createNotifications({
          userIds: notifyUserIds,
          message: `${req.user.name || "Someone"} added you to ${trimmedGroupName}`,
          targetPath: "/messages",
          type: "chat_group",
        });
      }

      return res.status(201).json({
        success: true,
        data: buildConversationSummary(conversation.toObject(), currentUserId, 0, presenceMap),
      });
    }

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
      isGroup: { $ne: true },
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

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/chat/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(cleanOriginalName).toLowerCase();
    cb(null, `chat-${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.rar', 'application/x-rar-compressed'
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.txt',
  '.zip',
  '.rar'
];

const chatFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_ATTACHMENT_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported. Allowed: Images (JPG, PNG, WEBP), PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR."), false);
  }
};

const chatMulter = multer({
  storage: chatStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: chatFileFilter
}).single("file");

function getMessageType(mimetype) {
  if (!mimetype) return "document";
  if (mimetype.startsWith("image/")) return "image";
  if ([
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.rar",
    "application/x-rar-compressed"
  ].includes(mimetype)) {
    return "archive";
  }
  return "document";
}

const uploadChatFile = (req, res) => {
  chatMulter(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Failed to upload file" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    try {
      const conversationId = req.body.conversationId;
      if (!conversationId) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "conversationId is required" });
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: req.user._id
      });

      if (!conversation) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(403).json({ success: false, message: "Unauthorized access to conversation" });
      }

      const fileUrl = `/api/messages/file/${req.file.filename}`;
      const msgType = getMessageType(req.file.mimetype);

      return res.json({
        success: true,
        data: {
          fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          messageType: msgType
        }
      });
    } catch (error) {
      console.error("Upload chat file error:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(500).json({ success: false, message: "Failed to save upload info" });
    }
  });
};

const getChatFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const resolvedPath = path.resolve("./uploads/chat/", safeFilename);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const fileUrlPart = `/api/messages/file/${safeFilename}`;
    const message = await Message.findOne({ fileUrl: fileUrlPart });
    if (!message) {
      return res.status(404).json({ success: false, message: "Associated chat message not found" });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: req.user._id
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: "You do not have access to this file" });
    }

    const disposition = req.query.disposition === "inline" ? "inline" : "attachment";
    
    res.setHeader("Content-Type", message.mimeType || "application/octet-stream");
    
    const escapedFilename = encodeURIComponent(message.fileName).replace(/'/g, "%27");
    res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${escapedFilename}`);

    return res.sendFile(resolvedPath);
  } catch (error) {
    console.error("Get chat file error:", error);
    return res.status(500).json({ success: false, message: "Failed to download file" });
  }
};

async function loadConversationSummaryLocal(conversationId, currentUserId) {
  const conversation = await Conversation.findById(conversationId)
    .populate("participants", "_id name email role department lastSeenAt")
    .populate({
      path: "lastMessageId",
      populate: { path: "senderId", select: "_id name email" },
    })
    .lean();

  if (!conversation) return null;

  const unreadCount = await Message.countDocuments({
    conversationId,
    senderId: { $ne: currentUserId },
    isDeleted: false,
    $or: [
      { readBy: { $ne: currentUserId } },
      { readBy: { $exists: false }, isRead: false },
      { readBy: { $size: 0 }, isRead: false },
    ],
  });

  const userIds = conversation.participants.map((participant) => String(participant._id));
  const presenceMap = getPresenceForUsers(userIds);

  let lastMsg = conversation.lastMessageId;
  const isDeletedForUser = lastMsg && 
    Array.isArray(lastMsg.deletedFor) && 
    lastMsg.deletedFor.some(d => String(d.userId) === String(currentUserId));

  if (isDeletedForUser) {
    const lastVisibleMsg = await Message.findOne({
      conversationId: conversation._id,
      "deletedFor.userId": { $ne: currentUserId }
    })
      .populate("senderId", "_id name email")
      .populate({
        path: "replyTo",
        select: "senderId messageText fileUrl fileName messageType isDeleted messageText rawMessageText",
        populate: { path: "senderId", select: "_id name email" }
      })
      .sort({ createdAt: -1 })
      .lean();
    
    conversation.lastMessageId = lastVisibleMsg;
  }

  return buildConversationSummary(conversation, currentUserId, unreadCount, presenceMap);
}

const toggleMessageReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;

    const trimmedEmoji = String(emoji || "").trim();
    if (!trimmedEmoji) {
      return res.status(400).json({ success: false, message: "Emoji is required" });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: currentUserId
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: "You do not have access to this conversation" });
    }

    const existingReaction = message.reactions.find(r => String(r.userId) === String(currentUserId));

    if (existingReaction) {
      if (existingReaction.emoji === trimmedEmoji) {
        await Message.updateOne(
          { _id: id },
          { $pull: { reactions: { userId: currentUserId } } }
        );
      } else {
        await Message.updateOne(
          { _id: id, "reactions.userId": currentUserId },
          { $set: { "reactions.$.emoji": trimmedEmoji, "reactions.$.reactedAt": new Date() } }
        );
      }
    } else {
      await Message.updateOne(
        { _id: id },
        { $push: { reactions: { userId: currentUserId, emoji: trimmedEmoji, reactedAt: new Date() } } }
      );
    }

    const updatedMessage = await Message.findById(id)
      .populate("senderId", "_id name email")
      .populate({
        path: "replyTo",
        select: "senderId messageText fileUrl fileName messageType isDeleted messageText rawMessageText",
        populate: { path: "senderId", select: "_id name email" }
      })
      .lean();

    const normalized = normalizeMessage(updatedMessage);

    const { emitToUsers } = require("../socket");
    conversation.participants.forEach(participantId => {
      emitToUsers([String(participantId)], "message:reaction-updated", {
        conversationId: String(conversation._id),
        messageId: String(id),
        reactions: normalized.reactions
      });
    });

    return res.json({ success: true, reactions: normalized.reactions });
  } catch (error) {
    console.error("Toggle reaction error:", error);
    return res.status(500).json({ success: false, message: "Failed to update reaction" });
  }
};

const forwardMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { conversationIds } = req.body;
    const currentUserId = req.user._id;

    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one destination conversation" });
    }

    const sourceMessage = await Message.findById(id);
    if (!sourceMessage) {
      return res.status(404).json({ success: false, message: "Source message not found" });
    }

    const sourceConversation = await Conversation.findOne({
      _id: sourceMessage.conversationId,
      participants: currentUserId
    });
    if (!sourceConversation) {
      return res.status(403).json({ success: false, message: "You do not have access to this conversation" });
    }

    const targetConversations = await Conversation.find({
      _id: { $in: conversationIds },
      participants: currentUserId
    });

    if (targetConversations.length !== conversationIds.length) {
      return res.status(403).json({ success: false, message: "One or more target conversations are inaccessible or invalid" });
    }

    const { emitToUsers } = require("../socket");

    for (const targetConv of targetConversations) {
      const newMsg = await Message.create({
        conversationId: targetConv._id,
        senderId: currentUserId,
        messageText: sourceMessage.messageText || "",
        fileUrl: sourceMessage.fileUrl || "",
        fileName: sourceMessage.fileName || "",
        fileSize: sourceMessage.fileSize || 0,
        mimeType: sourceMessage.mimeType || "",
        messageType: sourceMessage.messageType || "text",
        isForwarded: true,
        forwardedFromMessage: sourceMessage._id,
        readBy: [currentUserId]
      });

      targetConv.hiddenFor = [];
      targetConv.lastMessageId = newMsg._id;
      targetConv.lastMessageAt = newMsg.createdAt;
      await targetConv.save();

      const populatedNewMsg = await Message.findById(newMsg._id)
        .populate("senderId", "_id name email")
        .populate({
          path: "replyTo",
          select: "senderId messageText fileUrl fileName messageType isDeleted messageText rawMessageText",
          populate: { path: "senderId", select: "_id name email" }
        })
        .lean();

      const normalizedMsg = normalizeMessage(populatedNewMsg);

      await Promise.all(
        targetConv.participants.map(async (participantId) => {
          const conversationSummary = await loadConversationSummaryLocal(targetConv._id, participantId);
          emitToUsers([String(participantId)], "new_message", {
            conversationId: String(targetConv._id),
            message: normalizedMsg,
            conversation: conversationSummary,
          });
        })
      );
    }

    return res.json({ success: true, message: `Message forwarded successfully to ${conversationIds.length} chat(s)` });
  } catch (error) {
    console.error("Forward message error:", error);
    return res.status(500).json({ success: false, message: "Failed to forward message" });
  }
};

async function deleteMessageForMe(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const conversation = await ensureConversationMember(message.conversationId, currentUserId);
    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const alreadyDeleted = message.deletedFor.some(d => String(d.userId) === String(currentUserId));
    if (!alreadyDeleted) {
      message.deletedFor.push({ userId: currentUserId });
      await message.save();
    }

    return res.json({ success: true, message: "Message deleted for me" });
  } catch (error) {
    console.error("Delete message for me error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete message" });
  }
}

async function deleteMessageForEveryone(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (String(message.senderId) !== String(currentUserId)) {
      return res.status(403).json({ success: false, message: "Only the original sender may delete for everyone." });
    }

    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    if (messageAge > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Delete for everyone is available for 24 hours." });
    }

    if (message.isDeletedForEveryone) {
      return res.status(400).json({ success: false, message: "Message is already deleted." });
    }

    message.isDeleted = true;
    message.isDeletedForEveryone = true;
    message.deletedBy = currentUserId;
    message.deletedAt = new Date();
    message.messageText = "This message was deleted.";
    message.fileUrl = "";
    message.fileName = "";
    message.fileSize = 0;
    message.mimeType = "";
    message.messageType = "text";
    message.reactions = [];

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const { emitToUsers } = require("../socket");
      emitToUsers(conversation.participants.map(String), "message:deleted", {
        messageId: String(message._id),
        deletedForEveryone: true,
        deletedBy: String(currentUserId)
      });
    }

    return res.json({ success: true, message: "Message deleted for everyone" });
  } catch (error) {
    console.error("Delete message for everyone error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete message" });
  }
}

module.exports = {
  buildConversationSummary,
  createConversation,
  deleteMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  editMessage,
  ensureConversationMember,
  getChatDirectory,
  getConversationMessages,
  getConversations,
  getOnlineStatus,
  hideConversation,
  normalizeMessage,
  uploadChatFile,
  getChatFile,
  toggleMessageReaction,
  forwardMessage
};
