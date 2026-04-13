import React, { useEffect, useMemo, useRef, useState } from "react";
import { EllipsisVertical, Expand, MessageCircleMore, Pencil, Plus, Search, Send, Trash2, X } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import "./ChatPanel.css";

function formatConversationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function formatLastSeen(value) {
  if (!value) return "Offline";
  const date = new Date(value);
  return `Last seen ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function getInitials(name = "User") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function ChatPanel({ mode = "page", onClose, onExpand }) {
  const {
    conversations,
    createConversation,
    directory,
    fetchDirectory,
    hideConversation,
    launcherOpen,
    loadMoreMessages,
    loadingConversations,
    loadingMessages,
    messages,
    pagination,
    removeMessage,
    selectConversation,
    selectedConversation,
    sendMessage,
    sendTyping,
    socketReady,
    typingLabel,
    updateMessage,
  } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const currentUserId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const threadMenuRef = useRef(null);

  const isCompact = mode === "launcher";
  const shouldRender = mode === "page" || launcherOpen;

  const filteredConversations = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      const target = `${conversation.counterpart?.name || ""} ${conversation.counterpart?.email || ""} ${conversation.lastMessage?.messageText || ""}`.toLowerCase();
      return target.includes(needle);
    });
  }, [conversations, searchTerm]);

  useEffect(() => {
    if (selectedConversation?._id) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, selectedConversation?._id, typingLabel]);

  useEffect(() => {
    if (!showNewChat) return;
    let active = true;
    setDirectoryLoading(true);
    fetchDirectory(directorySearch).finally(() => {
      if (active) {
        setDirectoryLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [directorySearch, fetchDirectory, showNewChat]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (threadMenuRef.current && !threadMenuRef.current.contains(event.target)) {
        setShowThreadMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!shouldRender) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextValue = composerValue.trim();
    if (!nextValue || !selectedConversation?._id) return;

    try {
      setErrorMessage("");
      if (editingMessageId) {
        await updateMessage(editingMessageId, nextValue);
        setEditingMessageId(null);
      } else {
        await sendMessage(selectedConversation._id, nextValue);
      }
      setComposerValue("");
      sendTyping(selectedConversation._id, false);
    } catch (error) {
      setErrorMessage(error.message || "Unable to send message");
    }
  };

  const handleTyping = (value) => {
    setComposerValue(value);
    if (!selectedConversation?._id) return;

    sendTyping(selectedConversation._id, Boolean(value.trim()));
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(selectedConversation._id, false);
    }, 1200);
  };

  const startConversation = async (userId) => {
    try {
      setErrorMessage("");
      const conversation = await createConversation(userId, { openLauncher: isCompact });
      await selectConversation(conversation._id, { openLauncher: isCompact });
      setShowNewChat(false);
      setDirectorySearch("");
    } catch (error) {
      setErrorMessage(error.message || "Unable to start conversation");
    }
  };

  const openEdit = (message) => {
    if (message.isDeleted) return;
    setEditingMessageId(message._id);
    setComposerValue(message.rawMessageText || message.messageText || "");
  };

  const clearEdit = () => {
    setEditingMessageId(null);
    setComposerValue("");
  };

  const handleHideConversation = async () => {
    if (!selectedConversation?._id) return;

    try {
      await hideConversation(selectedConversation._id);
      setShowThreadMenu(false);
    } catch (error) {
      setErrorMessage(error.message || "Unable to remove chat");
    }
  };

  const availableDirectory = directory.filter(
    (user) => !conversations.some((conversation) => conversation.counterpart?._id === user._id)
  );

  return (
    <div className={`chat-panel ${isCompact ? "chat-panel--compact" : ""}`}>
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <div className="chat-sidebar__heading">
            <p className="chat-kicker">Realtime CRM chat</p>
            <h2>Messages</h2>
            <span className="chat-sidebar__count">{conversations.length} active chats</span>
          </div>
          <button type="button" className="chat-new-btn" onClick={() => setShowNewChat((open) => !open)}>
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        <label className="chat-search">
          <Search size={15} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search conversations"
          />
        </label>

        {showNewChat && (
          <div className="chat-directory">
            <div className="chat-directory__head">
              <span>Start new chat</span>
              <button type="button" onClick={() => setShowNewChat(false)}>
                <X size={14} />
              </button>
            </div>
            <label className="chat-search chat-search--inline">
              <Search size={14} />
              <input
                value={directorySearch}
                onChange={(event) => setDirectorySearch(event.target.value)}
                placeholder="Find teammates"
              />
            </label>
            <div className="chat-directory__list">
              {directoryLoading ? (
                <p className="chat-empty">Loading teammates...</p>
              ) : availableDirectory.length === 0 ? (
                <p className="chat-empty">No matching users found.</p>
              ) : (
                availableDirectory.map((user) => (
                  <button key={user._id} type="button" className="chat-directory__item" onClick={() => startConversation(user._id)}>
                    <span className="chat-avatar">{getInitials(user.name)}</span>
                    <span className="chat-directory__meta">
                      <strong>{user.name}</strong>
                      <small>{user.department || user.role || user.email}</small>
                    </span>
                    <span className={`chat-status-dot ${user.isOnline ? "is-online" : ""}`} />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="chat-conversation-list">
          {loadingConversations ? (
            <p className="chat-empty">Loading conversations...</p>
          ) : filteredConversations.length === 0 ? (
            <p className="chat-empty">No conversations yet. Start a new chat to begin.</p>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation._id}
                type="button"
                className={`chat-conversation ${selectedConversation?._id === conversation._id ? "is-active" : ""}`}
                onClick={() => selectConversation(conversation._id, { openLauncher: isCompact })}
              >
                <span className="chat-avatar">{getInitials(conversation.counterpart?.name)}</span>
                <span className="chat-conversation__body">
                  <span className="chat-conversation__top">
                    <strong>{conversation.counterpart?.name || "Unknown user"}</strong>
                    <time>{formatConversationTime(conversation.lastMessageAt)}</time>
                  </span>
                  <span className="chat-conversation__preview">
                    {conversation.lastMessage?.messageText || "No messages yet"}
                  </span>
                  <span className="chat-conversation__meta">
                    <span className={`chat-status-dot ${conversation.counterpart?.isOnline ? "is-online" : ""}`} />
                    <span>{conversation.counterpart?.isOnline ? "Online" : "Offline"}</span>
                    {conversation.lastMessage?.createdAt && (
                      <span className="chat-conversation__timestamp">{formatConversationTime(conversation.lastMessage.createdAt)}</span>
                    )}
                  </span>
                </span>
                {conversation.unreadCount > 0 && (
                  <span className="chat-badge">{conversation.unreadCount}</span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="chat-thread">
        {selectedConversation ? (
          <>
            <div className="chat-thread__header">
              <div className="chat-thread__identity">
                <span className="chat-avatar">{getInitials(selectedConversation.counterpart?.name)}</span>
                <div>
                  <h3>{selectedConversation.counterpart?.name}</h3>
                  <p>
                    <span className={`chat-status-dot ${selectedConversation.counterpart?.isOnline ? "is-online" : ""}`} />
                    {selectedConversation.counterpart?.isOnline ? "Online now" : formatLastSeen(selectedConversation.counterpart?.lastSeenAt)}
                  </p>
                </div>
              </div>
              <div className="chat-thread__actions">
                {!socketReady && <span className="chat-connection">Reconnecting...</span>}
                <div className="chat-thread__menu" ref={threadMenuRef}>
                  <button
                    type="button"
                    className="chat-round-btn"
                    onClick={() => setShowThreadMenu((open) => !open)}
                    aria-label="Chat actions"
                  >
                    <EllipsisVertical size={16} />
                  </button>
                  {showThreadMenu && (
                    <div className="chat-thread__menu-popup">
                      {isCompact && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowThreadMenu(false);
                            onExpand?.();
                          }}
                        >
                          <Expand size={14} />
                          <span>main chat</span>
                        </button>
                      )}
                      <button type="button" onClick={handleHideConversation}>
                        <Trash2 size={14} />
                        <span>Delete chat</span>
                      </button>
                    </div>
                  )}
                </div>
                {isCompact && (
                  <button type="button" className="chat-round-btn" onClick={onClose}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="chat-thread__messages">
              {pagination.hasMore && (
                <button
                  type="button"
                  className="chat-load-more"
                  onClick={() => loadMoreMessages(selectedConversation._id)}
                >
                  Load older messages
                </button>
              )}

              {messages.map((message) => {
                const isOwn = message.sender?._id === currentUserId;
                return (
                  <article key={message._id} className={`chat-bubble ${isOwn ? "chat-bubble--own" : ""}`}>
                    {!isOwn && <span className="chat-avatar chat-avatar--small">{getInitials(message.sender?.name)}</span>}
                    <div className="chat-bubble__body">
                      {!isOwn && <strong>{message.sender?.name}</strong>}
                      <p>{message.messageText}</p>
                      <footer>
                        <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {message.editedAt && <span>Edited</span>}
                        {isOwn && message.isRead && <span>Seen</span>}
                      </footer>
                    </div>
                    {isOwn && !message.isDeleted && (
                      <div className="chat-bubble__tools">
                        <button type="button" onClick={() => openEdit(message)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => removeMessage(message._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}

              {loadingMessages && <p className="chat-empty">Loading messages...</p>}
              {typingLabel && <p className="chat-typing">{typingLabel} is typing...</p>}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSubmit}>
              {editingMessageId && (
                <div className="chat-edit-banner">
                  <span>Editing message</span>
                  <button type="button" onClick={clearEdit}>Cancel</button>
                </div>
              )}
              <div className="chat-composer__row">
                <div className="chat-composer__field">
                  <textarea
                    value={composerValue}
                    onChange={(event) => handleTyping(event.target.value)}
                    placeholder="Type something..."
                    rows={isCompact ? 2 : 3}
                  />
                </div>
                <button type="submit" className="chat-send-btn">
                  <Send size={16} />
                  <span>{editingMessageId ? "Save" : "Send"}</span>
                </button>
              </div>
              {errorMessage && <p className="chat-error">{errorMessage}</p>}
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <MessageCircleMore size={42} />
            <h3>Select a conversation</h3>
            <p>Pick an existing thread or start a new chat from the left panel.</p>
          </div>
        )}
      </section>
    </div>
  );
}
