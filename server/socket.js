const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");
const { buildConversationSummary, normalizeMessage } = require("./utils/chatSerializers");

let ioInstance = null;
const INVALID_TOKEN_VALUES = new Set(["undefined", "null", ""]);
const activeUsers = new Map();
const typingTimers = new Map();

const normalizeToken = (value) => {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  const token = trimmedValue.replace(/^Bearer\s+/i, "").trim();

  if (!token || INVALID_TOKEN_VALUES.has(token.toLowerCase())) {
    return null;
  }

  return token;
};

const getConversationRoom = (conversationId) => `conversation:${conversationId}`;

function getPresenceForUsers(userIds = []) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  return uniqueIds.reduce((accumulator, userId) => {
    accumulator[userId] = {
      userId,
      isOnline: activeUsers.has(userId),
      lastSeen: activeUsers.get(userId)?.lastSeen || null,
    };
    return accumulator;
  }, {});
}

async function persistLastSeen(userId) {
  if (!userId) return;

  const lastSeen = new Date();
  const currentState = activeUsers.get(String(userId));

  if (currentState) {
    currentState.lastSeen = lastSeen;
    activeUsers.set(String(userId), currentState);
  }

  await User.findByIdAndUpdate(userId, { $set: { lastSeenAt: lastSeen } }).catch(() => {});
}

function setUserOnline(userId, socketId) {
  const userKey = String(userId);
  const state = activeUsers.get(userKey) || { socketIds: new Set(), lastSeen: null };
  state.socketIds.add(socketId);
  activeUsers.set(userKey, state);
}

function setUserOffline(userId, socketId) {
  const userKey = String(userId);
  const state = activeUsers.get(userKey);
  if (!state) return false;

  state.socketIds.delete(socketId);

  if (state.socketIds.size === 0) {
    activeUsers.delete(userKey);
    return true;
  }

  activeUsers.set(userKey, state);
  return false;
}

async function loadConversationSummary(conversationId, currentUserId) {
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
    isRead: false,
    isDeleted: false,
  });

  const userIds = conversation.participants.map((participant) => String(participant._id));
  const presenceMap = getPresenceForUsers(userIds);

  return buildConversationSummary(conversation, currentUserId, unreadCount, presenceMap);
}

function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || true,
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token =
        normalizeToken(socket.handshake.auth?.token) ||
        normalizeToken(socket.handshake.headers?.authorization);

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role name");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      socket.join(`user:${user._id}`);
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    setUserOnline(socket.user._id, socket.id);

    ioInstance.emit("user_online", {
      userId: String(socket.user._id),
      isOnline: true,
      lastSeen: null,
    });

    socket.emit("socket:ready", {
      userId: String(socket.user._id),
      role: socket.user.role,
    });

    socket.on("join_conversation", async ({ conversationId }, callback = () => {}) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        }).select("_id");

        if (!conversation) {
          callback({ success: false, message: "Conversation not found" });
          return;
        }

        socket.join(getConversationRoom(conversationId));
        callback({ success: true, conversationId: String(conversationId) });
      } catch (error) {
        callback({ success: false, message: "Failed to join conversation" });
      }
    });

    socket.on("send_message", async (payload, callback = () => {}) => {
      try {
        const conversationId = String(payload?.conversation_id || payload?.conversationId || "").trim();
        const messageText = String(payload?.message_text || payload?.messageText || "").trim();

        if (!conversationId || !messageText) {
          callback({ success: false, message: "Conversation and message are required" });
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conversation) {
          callback({ success: false, message: "Conversation not found" });
          return;
        }

        const message = await Message.create({
          conversationId: conversation._id,
          senderId: socket.user._id,
          messageText,
        });

        conversation.hiddenFor = [];
        conversation.lastMessageId = message._id;
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "_id name email")
          .lean();
        const normalizedMessage = normalizeMessage(populatedMessage);
        const conversationSummary = await loadConversationSummary(conversation._id, socket.user._id);

        emitToUsers(conversation.participants.map(String), "new_message", {
          conversationId: String(conversation._id),
          message: normalizedMessage,
          conversation: conversationSummary,
        });

        const recipientIds = conversation.participants
          .map(String)
          .filter((userId) => userId !== String(socket.user._id));

        if (recipientIds.length) {
          const { createNotifications } = require("./services/taskNotificationService");
          await createNotifications({
            userIds: recipientIds,
            message: `${socket.user.name}: ${messageText.slice(0, 80)}`,
            targetPath: "/messages",
          });
        }

        callback({
          success: true,
          data: {
            conversationId: String(conversation._id),
            message: normalizedMessage,
            conversation: conversationSummary,
          },
        });
      } catch (error) {
        console.error("Socket send_message error:", error);
        callback({ success: false, message: "Failed to send message" });
      }
    });

    socket.on("typing", async ({ conversation_id: conversationId, is_typing: isTyping }, callback = () => {}) => {
      try {
        if (!conversationId) {
          callback({ success: false, message: "Conversation is required" });
          return;
        }

        const roomName = getConversationRoom(conversationId);
        if (!socket.rooms.has(roomName)) {
          const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: socket.user._id,
          }).select("_id").lean();

          if (!conversation) {
            callback({ success: false, message: "Conversation not found" });
            return;
          }
          socket.join(roomName);
        }

        const timerKey = `${conversationId}:${socket.user._id}`;
        clearTimeout(typingTimers.get(timerKey));

        ioInstance.to(roomName).emit("user_typing", {
          conversationId: String(conversationId),
          userId: String(socket.user._id),
          userName: socket.user.name,
          isTyping: Boolean(isTyping),
        });

        if (isTyping) {
          typingTimers.set(
            timerKey,
            setTimeout(() => {
              ioInstance.to(roomName).emit("user_typing", {
                conversationId: String(conversationId),
                userId: String(socket.user._id),
                userName: socket.user.name,
                isTyping: false,
              });
              typingTimers.delete(timerKey);
            }, 3000)
          );
        }

        callback({ success: true });
      } catch (error) {
        callback({ success: false, message: "Failed to send typing event" });
      }
    });

    socket.on("mark_read", async ({ conversation_id: conversationId }, callback = () => {}) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conversation) {
          callback({ success: false, message: "Conversation not found" });
          return;
        }

        const readAt = new Date();
        const unreadMessages = await Message.find({
          conversationId,
          senderId: { $ne: socket.user._id },
          isRead: false,
          isDeleted: false,
        }).select("_id");

        if (unreadMessages.length) {
          await Message.updateMany(
            {
              _id: { $in: unreadMessages.map((message) => message._id) },
            },
            {
              $set: { isRead: true, readAt },
            }
          );
        }

        const messageIds = unreadMessages.map((message) => String(message._id));
        emitToUsers(conversation.participants.map(String), "message_read", {
          conversationId: String(conversationId),
          messageIds,
          readBy: String(socket.user._id),
          readAt,
        });

        callback({ success: true, data: { conversationId: String(conversationId), messageIds, readAt } });
      } catch (error) {
        callback({ success: false, message: "Failed to mark messages as read" });
      }
    });

    socket.on("edit_message", async ({ message_id: messageId, message_text: messageText }, callback = () => {}) => {
      try {
        const trimmedMessage = String(messageText || "").trim();
        if (!messageId || !trimmedMessage) {
          callback({ success: false, message: "Message text is required" });
          return;
        }

        const message = await Message.findOne({
          _id: messageId,
          senderId: socket.user._id,
          isDeleted: false,
        }).populate("senderId", "_id name email");

        if (!message) {
          callback({ success: false, message: "Message not found" });
          return;
        }

        message.messageText = trimmedMessage;
        message.editedAt = new Date();
        await message.save();

        const normalizedMessage = normalizeMessage(message.toObject());
        const conversation = await Conversation.findById(message.conversationId).select("participants");

        emitToUsers(conversation.participants.map(String), "message_updated", {
          conversationId: String(message.conversationId),
          message: normalizedMessage,
        });

        callback({ success: true, data: normalizedMessage });
      } catch (error) {
        callback({ success: false, message: "Failed to edit message" });
      }
    });

    socket.on("delete_message", async ({ message_id: messageId }, callback = () => {}) => {
      try {
        const message = await Message.findOne({
          _id: messageId,
          senderId: socket.user._id,
          isDeleted: false,
        });

        if (!message) {
          callback({ success: false, message: "Message not found" });
          return;
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.messageText = "This message was deleted.";
        await message.save();

        const conversation = await Conversation.findById(message.conversationId).select("participants");
        emitToUsers(conversation.participants.map(String), "message_deleted", {
          conversationId: String(message.conversationId),
          messageId: String(message._id),
          deletedAt: message.deletedAt,
        });

        callback({
          success: true,
          data: {
            conversationId: String(message.conversationId),
            messageId: String(message._id),
            deletedAt: message.deletedAt,
          },
        });
      } catch (error) {
        callback({ success: false, message: "Failed to delete message" });
      }
    });

    socket.on("disconnect", async () => {
      const wentOffline = setUserOffline(socket.user._id, socket.id);
      if (!wentOffline) return;

      await persistLastSeen(socket.user._id);
      const state = getPresenceForUsers([String(socket.user._id)])[String(socket.user._id)];

      ioInstance.emit("user_online", {
        userId: String(socket.user._id),
        isOnline: false,
        lastSeen: state?.lastSeen || new Date(),
      });
    });
  });

  return ioInstance;
}

function emitToUsers(userIds, eventName, payload) {
  if (!ioInstance || !Array.isArray(userIds)) return;

  [...new Set(userIds.filter(Boolean).map(String))].forEach((userId) => {
    ioInstance.to(`user:${userId}`).emit(eventName, payload);
  });
}

module.exports = {
  getPresenceForUsers,
  initializeSocket,
  emitToUsers,
};
