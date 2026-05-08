import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";
import { disconnectAppSocket, getAppSocket } from "../services/socket";

const ChatContext = createContext(null);

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

function normalizeDirectoryUsers(items = [], currentUserId) {
  const seen = new Set();

  return items
    .map((item) => {
      const linkedUserId = item.linkedUser?._id || item.linkedUser || item._id || item.sourceUserId;
      if (!linkedUserId) return null;

      return {
        _id: String(linkedUserId),
        name: item.name || item.linkedUser?.name || item.email || "User",
        email: item.email || item.linkedUser?.email || "",
        role: item.role || item.linkedUser?.role || "",
        department: item.department || item.linkedUser?.department || "",
        lastSeenAt: item.lastSeenAt || null,
        isOnline: Boolean(item.isOnline),
      };
    })
    .filter((item) => item && item._id !== String(currentUserId))
    .filter((item) => {
      if (seen.has(item._id)) return false;
      seen.add(item._id);
      return true;
    });
}

function upsertConversation(list, conversation) {
  const filtered = list.filter((item) => item._id !== conversation._id);
  return [conversation, ...filtered].sort(
    (left, right) => new Date(right.lastMessageAt || right.updatedAt || 0) - new Date(left.lastMessageAt || left.updatedAt || 0)
  );
}

function upsertMessage(list, message) {
  const filtered = list.filter((item) => item._id !== message._id);
  return [...filtered, message].sort(
    (left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0)
  );
}

function applyPresence(conversation, onlineMap) {
  if (!conversation?.counterpart) return conversation;
  const status = onlineMap[conversation.counterpart._id];
  if (!status) return conversation;

  return {
    ...conversation,
    counterpart: {
      ...conversation.counterpart,
      isOnline: status.isOnline,
      lastSeenAt: status.lastSeen || conversation.counterpart.lastSeenAt || null,
    },
  };
}

export function ChatProvider({ children }) {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [paginationByConversation, setPaginationByConversation] = useState({});
  const [typingByConversation, setTypingByConversation] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef(null);

  const unreadCount = useMemo(
    () => conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0),
    [conversations]
  );

  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingConversations(true);
      const { data } = await axios.get(apiUrl("/api/conversations"), getAuthConfig());
      setConversations(data.data || []);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  const fetchDirectory = useCallback(async (search = "") => {
    if (!token) return [];

    try {
      const { data } = await axios.get(apiUrl(`/api/users/chat-directory${search ? `?search=${encodeURIComponent(search)}` : ""}`), getAuthConfig());
      const users = normalizeDirectoryUsers(data.data || [], currentUserId);
      setDirectory(users);
      return users;
    } catch (error) {
      try {
        const { data } = await axios.get(apiUrl("/api/contacts"), getAuthConfig());
        const needle = search.trim().toLowerCase();
        const users = normalizeDirectoryUsers(data || [], currentUserId).filter((user) => {
          if (!needle) return true;
          return `${user.name} ${user.email} ${user.department} ${user.role}`.toLowerCase().includes(needle);
        });
        setDirectory(users);
        return users;
      } catch (fallbackError) {
        console.error("Failed to fetch chat directory", fallbackError);
        setDirectory([]);
        return [];
      }
    }
  }, [currentUserId, token]);

  const fetchOnlineStatus = useCallback(async (userIds = []) => {
    if (!token || !userIds.length) return;

    try {
      const { data } = await axios.get(
        apiUrl(`/api/users/online-status?userIds=${userIds.join(",")}`),
        getAuthConfig()
      );
      const statusMap = (data.data || []).reduce((accumulator, entry) => {
        accumulator[entry.userId] = entry;
        return accumulator;
      }, {});
      setOnlineUsers((current) => ({ ...current, ...statusMap }));
    } catch (error) {
      console.error("Failed to fetch online status", error);
    }
  }, [token]);

  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    if (!token || !conversationId) return;

    try {
      setLoadingMessages(true);
      const { data } = await axios.get(
        apiUrl(`/api/conversations/${conversationId}/messages?page=${page}&limit=50`),
        getAuthConfig()
      );
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: page === 1
          ? data.data || []
          : [...(data.data || []), ...(current[conversationId] || [])],
      }));
      setPaginationByConversation((current) => ({
        ...current,
        [conversationId]: data.pagination || { page, hasMore: false },
      }));
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  const emitWithAck = useCallback((eventName, payload) => {
    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      return Promise.reject(new Error("Chat connection is unavailable"));
    }

    return new Promise((resolve, reject) => {
      socket.emit(eventName, payload, (response) => {
        if (response?.success) {
          resolve(response.data || response);
          return;
        }

        reject(new Error(response?.message || "Request failed"));
      });
    });
  }, []);

  const selectConversation = useCallback(async (conversationId, options = {}) => {
    if (!conversationId) return;

    setSelectedConversationId(conversationId);
    if (options.openLauncher) {
      setLauncherOpen(true);
    }

    if (!messagesByConversation[conversationId] || options.forceReload) {
      await fetchMessages(conversationId, 1);
    }

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("join_conversation", { conversationId });
    }
  }, [fetchMessages, messagesByConversation]);

  const markConversationRead = useCallback(async (conversationId) => {
    if (!conversationId) return;

    try {
      await emitWithAck("mark_read", { conversation_id: conversationId });
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((message) =>
          message.sender?._id !== currentUserId ? { ...message, isRead: true, readAt: new Date().toISOString() } : message
        ),
      }));
    } catch (error) {
      console.error("Failed to mark messages as read", error);
    }
  }, [currentUserId, emitWithAck]);

  const createConversation = useCallback(async (participantId, options = {}) => {
    const { data } = await axios.post(
      apiUrl("/api/conversations"),
      { participantId },
      getAuthConfig()
    );
    const conversation = data.data;
    setConversations((current) => upsertConversation(current, conversation));
    setSelectedConversationId(conversation._id);
    if (options.openLauncher) {
      setLauncherOpen(true);
    }
    return conversation;
  }, []);

  const sendMessage = useCallback(async (conversationId, messageText) => {
    const payload = await emitWithAck("send_message", {
      conversation_id: conversationId,
      message_text: messageText,
    });

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: upsertMessage(current[conversationId] || [], payload.message),
    }));
    if (payload.conversation) {
      setConversations((current) => upsertConversation(current, payload.conversation));
    }
    return payload.message;
  }, [emitWithAck]);

  const updateMessage = useCallback((messageId, messageText) => {
    return emitWithAck("edit_message", {
      message_id: messageId,
      message_text: messageText,
    });
  }, [emitWithAck]);

  const removeMessage = useCallback((messageId) => {
    return emitWithAck("delete_message", {
      message_id: messageId,
    });
  }, [emitWithAck]);

  const hideConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;

    await axios.delete(apiUrl(`/api/conversations/${conversationId}`), getAuthConfig());
    setConversations((current) => current.filter((conversation) => conversation._id !== conversationId));
    setMessagesByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setPaginationByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setSelectedConversationId((current) => (current === conversationId ? null : current));
  }, []);

  const sendTyping = useCallback((conversationId, isTyping) => {
    const socket = socketRef.current;
    if (!socket?.connected || !conversationId) return;

    socket.emit("typing", {
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  }, []);

  const loadMoreMessages = useCallback(async (conversationId) => {
    const currentPage = paginationByConversation[conversationId]?.page || 1;
    await fetchMessages(conversationId, currentPage + 1);
  }, [fetchMessages, paginationByConversation]);

  useEffect(() => {
    fetchConversations();
    fetchDirectory();
  }, [fetchConversations, fetchDirectory]);

  useEffect(() => {
    const ids = conversations.map((conversation) => conversation.counterpart?._id).filter(Boolean);
    if (ids.length) {
      fetchOnlineStatus(ids);
    }
  }, [conversations, fetchOnlineStatus]);

  useEffect(() => {
    if (!Object.keys(onlineUsers).length) return;
    setConversations((current) => current.map((conversation) => applyPresence(conversation, onlineUsers)));
  }, [onlineUsers]);

  useEffect(() => {
    if (!selectedConversationId && conversations.length && !launcherOpen) {
      setSelectedConversationId(conversations[0]._id);
    }
  }, [conversations, selectedConversationId, launcherOpen]);

  useEffect(() => {
    if (selectedConversationId && !messagesByConversation[selectedConversationId]) {
      fetchMessages(selectedConversationId, 1);
    }
  }, [fetchMessages, messagesByConversation, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    const conversation = conversations.find((item) => item._id === selectedConversationId);
    if (conversation?.unreadCount) {
      markConversationRead(selectedConversationId);
    }
  }, [conversations, markConversationRead, selectedConversationId]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getAppSocket(token);
    socketRef.current = socket;

    const handleReady = () => {
      setSocketReady(true);
      fetchConversations();
    };

    const handleDisconnect = () => {
      setSocketReady(false);
    };

    const handleNewMessage = ({ conversationId, message, conversation }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: upsertMessage(current[conversationId] || [], message),
      }));

      if (conversation) {
        setConversations((current) => {
          const baseConversation = conversationId === selectedConversationId && message.sender?._id !== currentUserId
            ? { ...conversation, unreadCount: 0 }
            : conversation;
          return upsertConversation(current, baseConversation);
        });
      }

      if (conversationId === selectedConversationId && message.sender?._id !== currentUserId) {
        markConversationRead(conversationId);
      }
    };

    const handleMessageUpdated = ({ conversationId, message }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: upsertMessage(current[conversationId] || [], message),
      }));
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === conversationId && conversation.lastMessage?._id === message._id
            ? { ...conversation, lastMessage: message }
            : conversation
        )
      );
    };

    const handleMessageDeleted = ({ conversationId, messageId, deletedAt }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((message) =>
          message._id === messageId
            ? {
                ...message,
                messageText: "This message was deleted.",
                rawMessageText: "This message was deleted.",
                isDeleted: true,
                deletedAt,
              }
            : message
        ),
      }));
    };

    const handleMessageRead = ({ conversationId, messageIds, readAt }) => {
      const idSet = new Set(messageIds || []);
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((message) =>
          idSet.has(message._id) ? { ...message, isRead: true, readAt } : message
        ),
      }));
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );
    };

    const handleTyping = ({ conversationId, userId, userName, isTyping }) => {
      if (userId === currentUserId) return;
      setTypingByConversation((current) => ({
        ...current,
        [conversationId]: isTyping ? userName || "Someone" : "",
      }));
    };

    const handleUserOnline = ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers((current) => ({
        ...current,
        [userId]: { userId, isOnline, lastSeen },
      }));
      setConversations((current) =>
        current.map((conversation) =>
          conversation.counterpart?._id === userId
            ? {
                ...conversation,
                counterpart: {
                  ...conversation.counterpart,
                  isOnline,
                  lastSeenAt: lastSeen || conversation.counterpart.lastSeenAt || null,
                },
              }
            : conversation
        )
      );
      setDirectory((current) =>
        current.map((user) =>
          user._id === userId ? { ...user, isOnline, lastSeenAt: lastSeen || user.lastSeenAt || null } : user
        )
      );
    };

    socket.on("socket:ready", handleReady);
    socket.on("connect", handleReady);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_read", handleMessageRead);
    socket.on("user_typing", handleTyping);
    socket.on("user_online", handleUserOnline);

    return () => {
      socket.off("socket:ready", handleReady);

      socket.off("connect", handleReady);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_read", handleMessageRead);
      socket.off("user_typing", handleTyping);
      socket.off("user_online", handleUserOnline);
      disconnectAppSocket();
      socketRef.current = null;
    };
  }, [currentUserId, markConversationRead, selectedConversationId, token]);


  const value = useMemo(() => ({
    conversations,
    createConversation,
    directory,
    fetchDirectory,
    fetchMessages,
    fetchConversations,
    launcherOpen,
    hideConversation,
    loadMoreMessages,
    loadingConversations,
    loadingMessages,
    markConversationRead,
    messages: selectedConversationId ? messagesByConversation[selectedConversationId] || [] : [],
    pagination: selectedConversationId ? paginationByConversation[selectedConversationId] || {} : {},
    removeMessage,
    selectConversation,
    selectedConversation: conversations.find((conversation) => conversation._id === selectedConversationId) || null,
    selectedConversationId,
    sendMessage,
    sendTyping,
    setLauncherOpen,
    socketReady,
    typingLabel: selectedConversationId ? typingByConversation[selectedConversationId] || "" : "",
    unreadCount,
    updateMessage,
  }), [
    conversations,
    createConversation,
    directory,
    fetchDirectory,
    fetchMessages,
    fetchConversations,
    launcherOpen,
    hideConversation,
    loadMoreMessages,
    loadingConversations,
    loadingMessages,
    markConversationRead,
    messagesByConversation,
    paginationByConversation,
    removeMessage,
    selectConversation,
    selectedConversationId,
    sendMessage,
    sendTyping,
    socketReady,
    typingByConversation,
    unreadCount,
    updateMessage,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}
