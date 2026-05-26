import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";
import { getAppSocket } from "../services/socket";
import { initializeBrowserNotificationPermission, showBrowserNotification } from "../utils/browserNotifications";
import { initializeNotificationSound, playNotificationSound } from "../utils/notificationSound";

const MAIL_UNREAD_EVENT = "mail:unread-count";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
  timeout: 10000,
});

function dispatchUnreadCount(unreadCount) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MAIL_UNREAD_EVENT, { detail: { unreadCount } }));
}

export function useMail() {
  const token = localStorage.getItem("token");
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notConnected, setNotConnected] = useState(false);
  const [mailNotice, setMailNotice] = useState(null);
  const socketRef = useRef(null);

  const inboxFolder = useMemo(
    () => folders.find((folder) => String(folder.name || "").toLowerCase().includes("inbox")),
    [folders]
  );

  const updateFolders = useCallback((nextFolders) => {
    setFolders(nextFolders);
    const inbox = nextFolders.find((folder) => String(folder.name || "").toLowerCase().includes("inbox"));
    const nextUnreadCount = Number(inbox?.unreadCount || 0);
    setUnreadCount(nextUnreadCount);
    dispatchUnreadCount(nextUnreadCount);
  }, []);

  const fetchFolders = useCallback(async () => {
    if (!token) return [];

    try {
      setLoadingFolders(true);
      const { data } = await axios.get(apiUrl("/api/mail/folders"), authHeaders(token));
      const nextFolders = Array.isArray(data.folders) ? data.folders : [];
      setNotConnected(false);
      updateFolders(nextFolders);
      return nextFolders;
    } catch (error) {
      if (error.response?.data?.code === "ZOHO_NOT_CONNECTED") {
        setNotConnected(true);
      }
      return [];
    } finally {
      setLoadingFolders(false);
    }
  }, [token, updateFolders]);

  const fetchMessages = useCallback(
    async (folderId, options = {}) => {
      if (!token || !folderId) return;

      try {
        setLoadingMessages(true);
        const start = Number(options.start || 0);
        const limit = Number(options.limit || 20);
        const { data } = await axios.get(apiUrl("/api/mail/messages"), {
          ...authHeaders(token),
          params: { folderId, start, limit },
        });
        const nextMessages = Array.isArray(data.messages) ? data.messages : [];
        setMessages((current) => (start > 0 ? [...current, ...nextMessages] : nextMessages));
        setHasMore(nextMessages.length >= limit);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token]
  );

  const loadMore = useCallback(
    async (folderId) => {
      await fetchMessages(folderId, { start: messages.length, limit: 20 });
    },
    [fetchMessages, messages.length]
  );

  const fetchMessage = useCallback(
    async (messageId, folderId) => {
      if (!token || !messageId) return null;

      try {
        setLoadingMessage(true);
        const { data } = await axios.get(apiUrl(`/api/mail/messages/${messageId}`), {
          ...authHeaders(token),
          params: folderId ? { folderId } : undefined,
        });
        setSelectedMessage(data.message || null);
        setSelectedMessageId(messageId);
        return data.message || null;
      } finally {
        setLoadingMessage(false);
      }
    },
    [token]
  );

  const sendEmail = useCallback(
    async (payload) => {
      if (!token) return null;
      setSending(true);
      try {
        const { data } = await axios.post(apiUrl("/api/mail/messages/send"), payload, authHeaders(token));
        return data;
      } finally {
        setSending(false);
      }
    },
    [token]
  );

  const replyToEmail = useCallback(
    async (messageId, payload) => {
      if (!token) return null;
      setSending(true);
      try {
        const { data } = await axios.post(apiUrl(`/api/mail/messages/${messageId}/reply`), payload, authHeaders(token));
        return data;
      } finally {
        setSending(false);
      }
    },
    [token]
  );

  const search = useCallback(
    async (query) => {
      if (!token || String(query || "").trim().length < 2) return;
      setSearching(true);
      try {
        const { data } = await axios.get(apiUrl("/api/mail/search"), {
          ...authHeaders(token),
          params: { q: query.trim(), limit: 20, start: 0 },
        });
        setSearchQuery(query.trim());
        setSearchResults(Array.isArray(data.messages) ? data.messages : []);
      } finally {
        setSearching(false);
      }
    },
    [token]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const uploadAttachment = useCallback(
    async (file, onUploadProgress) => {
      if (!token) return null;
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post(apiUrl("/api/mail/attachments/upload"), formData, {
        ...authHeaders(token),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      });
      return data;
    },
    [token]
  );

  const deleteEmail = useCallback(
    async (messageId) => {
      if (!token) return;
      await axios.delete(apiUrl(`/api/mail/messages/${messageId}`), authHeaders(token));
      setMessages((current) => current.filter((message) => message.messageId !== messageId));
      if (selectedMessageId === messageId) {
        setSelectedMessageId(null);
        setSelectedMessage(null);
      }
    },
    [selectedMessageId, token]
  );

  const linkToEntity = useCallback(
    async (messageId, entityType, entityId) => {
      if (!token) return null;
      const { data } = await axios.post(
        apiUrl(`/api/mail/messages/${messageId}/link`),
        { entityType, entityId },
        authHeaders(token)
      );
      setSelectedMessage((current) =>
        current && current.messageId === messageId
          ? {
              ...current,
              linkedEntityType: data.emailThread?.linkedEntityType || entityType,
              linkedEntityId: data.emailThread?.linkedEntityId || entityId,
              isLinked: true,
            }
          : current
      );
      setMessages((current) =>
        current.map((message) =>
          message.messageId === messageId
            ? { ...message, linkedEntityType: entityType, linkedEntityId: entityId, isLinked: true }
            : message
        )
      );
      return data.emailThread;
    },
    [token]
  );

  const unlinkFromEntity = useCallback(
    async (messageId) => {
      if (!token) return null;
      const { data } = await axios.delete(apiUrl(`/api/mail/messages/${messageId}/link`), authHeaders(token));
      setSelectedMessage((current) =>
        current && current.messageId === messageId
          ? { ...current, linkedEntityType: null, linkedEntityId: null, isLinked: false }
          : current
      );
      setMessages((current) =>
        current.map((message) =>
          message.messageId === messageId
            ? { ...message, linkedEntityType: null, linkedEntityId: null, isLinked: false }
            : message
        )
      );
      return data.emailThread;
    },
    [token]
  );

  const updateNote = useCallback(
    async (messageId, note) => {
      if (!token) return null;
      const { data } = await axios.patch(
        apiUrl(`/api/mail/messages/${messageId}/note`),
        { note },
        authHeaders(token)
      );
      setSelectedMessage((current) =>
        current && current.messageId === messageId ? { ...current, crmNote: data.emailThread?.crmNote || note } : current
      );
      setMessages((current) =>
        current.map((message) => (message.messageId === messageId ? { ...message, crmNote: note } : message))
      );
      return data.emailThread;
    },
    [token]
  );

  useEffect(() => {
    initializeNotificationSound();
    initializeBrowserNotificationPermission();
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getAppSocket(token);
    socketRef.current = socket;
    if (!socket) return undefined;

    const handleNewMail = (payload) => {
      playNotificationSound();
      setMailNotice(payload);
      window.setTimeout(() => setMailNotice(null), 5000);
      showBrowserNotification({
        title: "Netcradus CRM",
        body: `New email from ${payload.fromAddress || "Unknown sender"}`,
        tag: `mail:${payload.messageId}`,
        onClick: () => window.focus(),
      });

      setFolders((current) => {
        const nextFolders = current.map((folder) =>
          String(folder.name || "").toLowerCase().includes("inbox")
            ? { ...folder, unreadCount: Number(folder.unreadCount || 0) + 1, messageCount: Number(folder.messageCount || 0) + 1 }
            : folder
        );
        const inbox = nextFolders.find((folder) => String(folder.name || "").toLowerCase().includes("inbox"));
        const nextUnread = Number(inbox?.unreadCount || 0);
        setUnreadCount(nextUnread);
        return nextFolders;
      });

      setMessages((current) => {
        if (!inboxFolder) return current;
        return [
          {
            messageId: payload.messageId,
            subject: payload.subject,
            fromAddress: payload.fromAddress,
            summary: payload.snippet,
            receivedTime: payload.receivedAt,
            hasAttachment: payload.hasAttachments,
            isRead: false,
            linkedEntityType: null,
            linkedEntityId: null,
            isLinked: false,
          },
          ...current,
        ];
      });
    };

    socket.on("new_mail", handleNewMail);
    return () => {
      socket.off("new_mail", handleNewMail);
    };
  }, [inboxFolder, token]);

  return {
    clearSearch,
    deleteEmail,
    fetchFolders,
    fetchMessage,
    fetchMessages,
    folders,
    hasMore,
    linkToEntity,
    loadMore,
    loadingFolders,
    loadingMessage,
    loadingMessages,
    mailNotice,
    messages,
    notConnected,
    replyToEmail,
    search,
    searchQuery,
    searchResults,
    searching,
    selectedMessage,
    selectedMessageId,
    sendEmail,
    sending,
    setSelectedMessage,
    setSelectedMessageId,
    unlinkFromEntity,
    unreadCount,
    updateNote,
    uploadAttachment,
  };
}

export { MAIL_UNREAD_EVENT };
