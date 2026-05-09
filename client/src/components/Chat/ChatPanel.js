import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, EllipsisVertical, Expand, MessageCircleMore, Plus, Search, Send, Trash2, X } from "lucide-react";
import { useChat } from "../../context/ChatContext";
// import "./ChatPanel.css";


function formatConversationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday 
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function getInitials(name = "User") {
  return String(name).split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
}

export default function ChatPanel({ mode = "page", onClose, onExpand }) {
  const {
    conversations, createConversation, directory, fetchDirectory, hideConversation,
    loadMoreMessages, loadingConversations, messages,
    pagination, selectConversation, selectedConversation, sendMessage,
    sendTyping, typingLabel, updateMessage,
  } = useChat();

  const [searchTerm, setSearchTerm] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  
  const currentUserId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const threadMenuRef = useRef(null);

  const [view, setView] = useState("list"); // list or detail
  const isCompact = mode === "launcher";
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedConversation?._id) {
      setView("detail");
    }
  }, [selectedConversation?._id]);

  const filteredConversations = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter(c => {
      const target = `${c.counterpart?.name || ""} ${c.lastMessage?.messageText || ""}`.toLowerCase();
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
    fetchDirectory(directorySearch);
  }, [directorySearch, fetchDirectory, showNewChat]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const val = composerValue.trim();
    if (!val || !selectedConversation?._id) return;
    try {
      if (editingMessageId) {
        await updateMessage(editingMessageId, val);
        setEditingMessageId(null);
      } else {
        await sendMessage(selectedConversation._id, val);
      }
      setComposerValue("");
      sendTyping(selectedConversation._id, false);
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleTyping = (val) => {
    setComposerValue(val);
    if (!selectedConversation?._id) return;
    sendTyping(selectedConversation._id, Boolean(val.trim()));
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(selectedConversation._id, false), 1200);
  };

  const startConversation = async (userId) => {
    try {
      const conv = await createConversation(userId, { openLauncher: isCompact });
      await selectConversation(conv._id, { openLauncher: isCompact });
      setShowNewChat(false);
      setDirectorySearch("");
      setView("detail");
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleBack = () => {
    setView("list");
  };

  return (
    <div className={`chat-panel ${isCompact ? "chat-panel--compact" : "chat-panel--page"} ${isMobile ? "is-mobile" : ""} view-${view}`}>
      {/* SIDEBAR (List View) */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <div className="chat-sidebar__heading">
            <h2>Messages</h2>
            <span className="chat-sidebar__count">{conversations.length} active</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
             <button type="button" className="chat-round-btn" onClick={() => setShowNewChat(!showNewChat)}>
                <Plus size={18} />
             </button>
             {isCompact && <button type="button" className="chat-round-btn" onClick={onClose}><X size={18} /></button>}
          </div>
        </div>

        <div className="chat-search">
          <Search size={16} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." />
        </div>

        {showNewChat && (
          <div className="chat-directory">
            <div className="chat-directory__head">
              <span>New Conversation</span>
              <button type="button" onClick={() => setShowNewChat(false)}><X size={14} /></button>
            </div>
            <div className="chat-search" style={{ height: '36px', marginBottom: 'var(--space-2)' }}>
              <input value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} placeholder="Find user..." />
            </div>
            <div className="chat-directory__list">
              {availableDirectory(directory, conversations).map(user => (
                <button key={user._id} className="chat-directory__item" onClick={() => startConversation(user._id)}>
                  <div className="chat-avatar">{getInitials(user.name)}</div>
                  <div className="chat-directory__meta">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                  <div className={`chat-status-dot ${user.isOnline ? "is-online" : ""}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-conversation-list">
          {loadingConversations ? <div className="chat-empty">Loading...</div> :
            filteredConversations.map(c => (
              <button key={c._id} className={`chat-conversation ${selectedConversation?._id === c._id ? "is-active" : ""}`} onClick={() => {
                  selectConversation(c._id, { openLauncher: isCompact });
                  setView("detail");
                }}>
                <div className="chat-avatar">{getInitials(c.counterpart?.name)}</div>
                <div className="chat-conversation__body">
                  <div className="chat-conversation__top">
                    <strong>{c.counterpart?.name}</strong>
                    <time>{formatConversationTime(c.lastMessageAt)}</time>
                  </div>
                  <p className="chat-conversation__preview">{c.lastMessage?.messageText || "No messages"}</p>
                </div>
                {c.unreadCount > 0 && <span className="chat-badge">{c.unreadCount}</span>}
              </button>
            ))
          }
        </div>
      </aside>

      {/* THREAD (Detail View) */}
      <section className="chat-thread">
        {selectedConversation ? (
          <>
            <div className="chat-thread__header">
              <div className="chat-thread__identity">
                {(isMobile || isCompact) && <button className="chat-round-btn" onClick={handleBack} style={{ marginRight: 'var(--space-2)' }}><ArrowLeft size={20} /></button>}
                <div className="chat-avatar">{getInitials(selectedConversation.counterpart?.name)}</div>
                <div>
                  <h3>{selectedConversation.counterpart?.name}</h3>
                  <p>
                    <span className={`chat-status-dot ${selectedConversation.counterpart?.isOnline ? "is-online" : ""}`} />
                    {selectedConversation.counterpart?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="chat-thread__actions">
                <div className="chat-thread__menu" ref={threadMenuRef}>
                  <button type="button" className="chat-round-btn" onClick={() => setShowThreadMenu(!showThreadMenu)}>
                    <EllipsisVertical size={18} />
                  </button>
                  {showThreadMenu && (
                    <div className="chat-thread__menu-popup">
                      {isCompact && <button onClick={() => { setShowThreadMenu(false); onExpand?.(); }}><Expand size={14} /> Full View</button>}
                      <button onClick={async () => { await hideConversation(selectedConversation._id); setShowThreadMenu(false); if(isMobile) setView('list'); }}><Trash2 size={14} /> Delete Chat</button>
                    </div>
                  )}
                </div>
                {isCompact && !isMobile && <button type="button" className="chat-round-btn" onClick={onClose}><X size={18} /></button>}
              </div>
            </div>

            <div className="chat-thread__messages">
              {pagination.hasMore && <button className="chat-load-more" onClick={() => loadMoreMessages(selectedConversation._id)}>Load More</button>}
              {messages.map(m => {
                const isOwn = m.sender?._id === currentUserId;
                return (
                  <article key={m._id} className={`chat-bubble ${isOwn ? "chat-bubble--own" : ""} ${m.isDeleted ? "is-deleted" : ""}`} data-deleted={m.isDeleted ? "true" : "false"}>
                    {!isOwn && <div className="chat-avatar chat-avatar--small">{getInitials(m.sender?.name)}</div>}
                    <div className="chat-bubble__body">
                      <p>{m.messageText}</p>
                      <footer>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {isOwn && m.isRead && <span style={{ color: 'var(--color-accent)' }}>Seen</span>}
                      </footer>
                    </div>
                  </article>
                );
              })}
              {typingLabel && <p className="chat-typing">{typingLabel} is typing...</p>}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSubmit}>
              <div className="chat-composer__row">
                <textarea
                  value={composerValue}
                  onChange={e => handleTyping(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Type a message..."
                  rows={1}
                  spellCheck={true}
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  autoComplete="on"
                  lang="en-US"
                  translate="no"
                  data-autocorrect="on"
                  data-spellcheck="true"
                />
                <button type="submit" className="chat-send-btn"><Send size={18} /></button>
              </div>
              {errorMessage && <p className="chat-error">{errorMessage}</p>}
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <MessageCircleMore size={48} strokeWidth={1} />
            <h3>Your Messages</h3>
            <p>Select a conversation to start chatting.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function availableDirectory(directory, conversations) {
  return directory.filter(u => !conversations.some(c => c.counterpart?._id === u._id));
}
