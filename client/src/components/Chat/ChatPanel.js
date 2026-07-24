import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, CornerUpLeft, EllipsisVertical, Expand, MessageCircleMore, Paperclip, Plus, Search, Send, Share2, Smile, Trash2, Users, X } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { apiUrl } from "../../config/api";
import axios from "axios";


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

function getConversationTitle(conversation) {
  if (!conversation) return "Conversation";
  return conversation.isGroup
    ? conversation.displayName || conversation.groupName || "Group chat"
    : conversation.counterpart?.name || "User";
}

function getConversationSubtitle(conversation) {
  if (!conversation) return "";
  if (conversation.isGroup) {
    const count = conversation.participants?.length || 0;
    const onlineCount = (conversation.participants || []).filter((participant) => participant.isOnline).length;
    return `${count} member${count === 1 ? "" : "s"} - ${onlineCount} online`;
  }
  return conversation.counterpart?.isOnline ? "Online" : "Offline";
}

function getMemberStatus(user) {
  return user?.isOnline ? "Online" : "Offline";
}

function ChatImage({ src, alt, style, onClick }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let url = "";

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const token = localStorage.getItem("token");
        const response = await axios.get(apiUrl(src), {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
          timeout: 15000,
        });

        if (active) {
          url = URL.createObjectURL(response.data);
          setBlobUrl(url);
        }
      } catch (err) {
        console.error("Failed to load authenticated chat image:", err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-alt, #18181c)", padding: "10px", borderRadius: "6px" }}>
        <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Loading Image...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-alt, #18181c)", padding: "10px", borderRadius: "6px" }}>
        <span style={{ fontSize: "10px", color: "#ff4444" }}>⚠️ Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      style={style}
      onClick={() => onClick(blobUrl)}
    />
  );
}

export default function ChatPanel({ mode = "page", onClose, onExpand }) {
  const {
    conversations, createConversation, createGroupConversation, directory, fetchDirectory, hideConversation,
    loadMoreMessages, loadingConversations, messages,
    pagination, selectConversation, selectedConversation, sendMessage,
    sendTyping, typingLabel, updateMessage, uploadChatFile,
    replyToMessage, setReplyToMessage, addReaction, forwardMessage,
    deleteMessageForMe, deleteMessageForEveryone,
  } = useChat();

  const [searchTerm, setSearchTerm] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUserIds, setSelectedGroupUserIds] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [showGroupProfile, setShowGroupProfile] = useState(false);

  // File and Emoji States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxTitle, setLightboxTitle] = useState(null);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  // Forwarding States
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [forwardSearch, setForwardSearch] = useState("");
  const [selectedForwardConvIds, setSelectedForwardConvIds] = useState([]);
  const [isForwardingLoading, setIsForwardingLoading] = useState(false);

  // Reactions States
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState(null);

  // Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [deleteOption, setDeleteOption] = useState("me");
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Mobile Action Menu State
  const [activeMobileActionMenuMessageId, setActiveMobileActionMenuMessageId] = useState(null);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const composerRef = useRef(null);

  const handleDownloadFile = async (messageId, fileUrl, fileName, disposition = "attachment") => {
    if (downloadingFileId) return;

    try {
      setDownloadingFileId(messageId);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      const url = apiUrl(fileUrl) + `?disposition=${disposition}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
        timeout: 25000,
      });

      const blobUrl = URL.createObjectURL(response.data);

      if (disposition === "inline") {
        window.open(blobUrl, "_blank");
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 15000);
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Download failed:", err);
      if (err.response?.status === 403) {
        showToast("You do not have access to this file");
        setErrorMessage("You do not have access to this file");
      } else {
        showToast("Unable to download file");
        setErrorMessage("Unable to download file");
      }
    } finally {
      setDownloadingFileId(null);
    }
  };

  const isViewable = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt'].includes(ext);
  };

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
      setActiveReactionPickerMessageId(null);
      setActiveMobileActionMenuMessageId(null);
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
      showToast("Unable to update reaction");
    }
  };

  const handleForwardMessage = async () => {
    if (selectedForwardConvIds.length === 0 || !forwardingMessage) return;

    try {
      setIsForwardingLoading(true);
      await forwardMessage(forwardingMessage._id, selectedForwardConvIds);

      const count = selectedForwardConvIds.length;
      showToast(`Message forwarded successfully to ${count} conversation${count === 1 ? "" : "s"}.`);

      setShowForwardModal(false);
      setForwardingMessage(null);
      setSelectedForwardConvIds([]);
      setForwardSearch("");
    } catch (err) {
      console.error("Forwarding failed:", err);
      showToast("Failed to forward message");
    } finally {
      setIsForwardingLoading(false);
    }
  };

  const handleToggleSelectConv = (convId) => {
    setSelectedForwardConvIds(prev => 
      prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId]
    );
  };

  const handleDeleteMessageSubmit = async () => {
    if (!deletingMessage) return;

    try {
      setIsDeletingLoading(true);
      if (deleteOption === "me") {
        await deleteMessageForMe(deletingMessage._id);
        showToast("Message deleted for you");
      } else {
        await deleteMessageForEveryone(deletingMessage._id);
        showToast("Message deleted for everyone");
      }
      setShowDeleteModal(false);
      setDeletingMessage(null);
    } catch (err) {
      console.error("Deletion failed:", err);
      const msg = err.response?.data?.message || "Failed to delete message";
      showToast(msg);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const COMMON_EMOJIS = [
    "😀", "😂", "❤️", "👍", "🎉", "🔥", "🚀", "🙌", "😊", "🤣", "😍", "🥰", "😘", "😉", "😎", "🤩",
    "🤔", "😅", "👏", "🙏", "🌟", "🎈", "🎂", "💻", "📱", "📄", "📎", "⏰", "✅", "❌", "👀", "✨"
  ];

  // Click outside listener for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key listener for emoji picker, reactions, mobile menu
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowEmojiPicker(false);
        setActiveReactionPickerMessageId(null);
        setActiveMobileActionMenuMessageId(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const reactionPickerRef = useRef(null);
  const mobileActionMenuRef = useRef(null);

  // Click outside listener for reactions picker and mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target)
      ) {
        setActiveReactionPickerMessageId(null);
      }
      if (
        mobileActionMenuRef.current &&
        !mobileActionMenuRef.current.contains(event.target)
      ) {
        setActiveMobileActionMenuMessageId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Insert emoji at cursor position
  const insertEmoji = (emoji) => {
    const textarea = composerRef.current;
    if (!textarea) {
      setComposerValue((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setComposerValue(before + emoji + after);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (25 MB max)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage("File is too large. Maximum size is 25 MB.");
      showToast("File exceeds 25 MB limit");
      return;
    }

    // Validate type
    const ALLOWED_EXTS = [
      'jpg', 'jpeg', 'png', 'webp',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt',
      'zip', 'rar'
    ];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(extension)) {
      setErrorMessage("Unsupported file type. Permitted: Images, PDF, Word, Excel, PPT, TXT, ZIP, RAR.");
      showToast("Unsupported file extension");
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
    setUploading(true);
    setErrorMessage("");

    try {
      const data = await uploadChatFile(file, selectedConversation._id, (percent) => {
        setUploadProgress(percent);
      });
      setUploadedFileData(data);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to upload file. Please try again.");
      showToast("Upload failed");
      setSelectedFile(null);
      setUploadedFileData(null);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(null);
    setUploadedFileData(null);
    setUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const currentUserId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const threadMenuRef = useRef(null);
  const toastTimeoutRef = useRef(null);

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
      setShowGroupProfile(false);
    }
  }, [selectedConversation?._id]);

  const filteredConversations = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter(c => {
      const participantNames = (c.participants || []).map((participant) => participant.name).join(" ");
      const target = `${getConversationTitle(c)} ${participantNames} ${c.lastMessage?.messageText || ""}`.toLowerCase();
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

  useEffect(() => {
    return () => clearTimeout(toastTimeoutRef.current);
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const val = composerValue.trim();
    if ((!val && !uploadedFileData) || !selectedConversation?._id) return;
    if (uploading) return;
    try {
      if (editingMessageId) {
        await updateMessage(editingMessageId, val);
        setEditingMessageId(null);
      } else {
        await sendMessage(selectedConversation._id, val, uploadedFileData);
      }
      setComposerValue("");
      setSelectedFile(null);
      setUploadedFileData(null);
      setShowEmojiPicker(false);
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

  const toggleGroupUser = (userId) => {
    setSelectedGroupUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const startGroupConversation = async () => {
    try {
      if (!groupName.trim()) {
        const message = "Please enter group name";
        setErrorMessage(message);
        showToast(message);
        return;
      }
      if (selectedGroupUserIds.length < 1) {
        setErrorMessage("Select at least one person for a group");
        return;
      }

      const conv = await createGroupConversation(
        { groupName: groupName.trim(), participantIds: selectedGroupUserIds },
        { openLauncher: isCompact }
      );
      await selectConversation(conv._id, { openLauncher: isCompact });
      setShowNewChat(false);
      setDirectorySearch("");
      setGroupName("");
      setSelectedGroupUserIds([]);
      setNewChatMode("direct");
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
              <span>{newChatMode === "group" ? "New Group" : "New Conversation"}</span>
              <button type="button" onClick={() => setShowNewChat(false)}><X size={14} /></button>
            </div>
            <div className="chat-mode-tabs">
              <button type="button" className={newChatMode === "direct" ? "is-active" : ""} onClick={() => setNewChatMode("direct")}>Direct</button>
              <button type="button" className={newChatMode === "group" ? "is-active" : ""} onClick={() => setNewChatMode("group")}>Group</button>
            </div>
            {toastMessage && (
              <div className="chat-toast" role="alert" aria-live="assertive">
                <AlertCircle size={15} />
                <span>{toastMessage}</span>
              </div>
            )}
            {newChatMode === "group" && (
              <input
                className="chat-group-name-input"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Group name"
                maxLength={120}
              />
            )}
            <div className="chat-search" style={{ height: '36px', marginBottom: 'var(--space-2)' }}>
              <input value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} placeholder="Find user..." />
            </div>
            <div className="chat-directory__list">
              {(newChatMode === "group" ? directory : availableDirectory(directory, conversations)).map(user => (
                <button key={user._id} className={`chat-directory__item ${selectedGroupUserIds.includes(user._id) ? "is-selected" : ""}`} onClick={() => newChatMode === "group" ? toggleGroupUser(user._id) : startConversation(user._id)}>
                  <div className="chat-avatar">{getInitials(user.name)}</div>
                  <div className="chat-directory__meta">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                    {newChatMode === "group" && (
                      <small className={user.isOnline ? "chat-member-status is-online" : "chat-member-status"}>
                        {getMemberStatus(user)}
                      </small>
                    )}
                  </div>
                  {newChatMode === "group"
                    ? <span className="chat-select-mark">{selectedGroupUserIds.includes(user._id) && <Check size={14} />}</span>
                    : <div className={`chat-status-dot ${user.isOnline ? "is-online" : ""}`} />}
                </button>
              ))}
            </div>
            {newChatMode === "group" && (
              <div className="chat-create-group-footer">
                <span>{selectedGroupUserIds.length} selected</span>
                <button type="button" className="chat-create-group-btn" onClick={startGroupConversation}>
                  <Users size={15} />
                  Create Group
                </button>
              </div>
            )}
          </div>
        )}

        <div className="chat-conversation-list">
          {loadingConversations ? <div className="chat-empty">Loading...</div> :
            filteredConversations.map(c => (
              <button key={c._id} className={`chat-conversation ${selectedConversation?._id === c._id ? "is-active" : ""}`} onClick={() => {
                  selectConversation(c._id, { openLauncher: isCompact });
                  setView("detail");
                }}>
                <div className="chat-avatar">{c.isGroup ? <Users size={17} /> : getInitials(c.counterpart?.name)}</div>
                <div className="chat-conversation__body">
                  <div className="chat-conversation__top">
                    <strong>{getConversationTitle(c)}</strong>
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
              <div
                role={selectedConversation.isGroup ? "button" : undefined}
                tabIndex={selectedConversation.isGroup ? 0 : undefined}
                className={`chat-thread__identity ${selectedConversation.isGroup ? "is-clickable" : ""}`}
                onClick={() => selectedConversation.isGroup && setShowGroupProfile((current) => !current)}
                onKeyDown={(event) => {
                  if (!selectedConversation.isGroup) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setShowGroupProfile((current) => !current);
                  }
                }}
              >
                {(isMobile || isCompact) && <button className="chat-round-btn" onClick={handleBack} style={{ marginRight: 'var(--space-2)' }}><ArrowLeft size={20} /></button>}
                <div className="chat-avatar">{selectedConversation.isGroup ? <Users size={18} /> : getInitials(selectedConversation.counterpart?.name)}</div>
                <div>
                  <h3>{getConversationTitle(selectedConversation)}</h3>
                  <p>
                    {!selectedConversation.isGroup && <span className={`chat-status-dot ${selectedConversation.counterpart?.isOnline ? "is-online" : ""}`} />}
                    {getConversationSubtitle(selectedConversation)}
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
            {selectedConversation.isGroup && showGroupProfile && (
              <div className="chat-group-profile">
                <div className="chat-group-profile__head">
                  <div>
                    <h4>{getConversationTitle(selectedConversation)}</h4>
                    <p>{getConversationSubtitle(selectedConversation)}</p>
                  </div>
                  <button type="button" className="chat-round-btn" onClick={() => setShowGroupProfile(false)}><X size={16} /></button>
                </div>
                <div className="chat-group-member-list">
                  {(selectedConversation.participants || []).map((member) => (
                    <div key={member._id} className="chat-group-member">
                      <div className="chat-avatar chat-avatar--small">{getInitials(member.name)}</div>
                      <div>
                        <strong>{member._id === currentUserId ? `${member.name || "You"} (You)` : member.name || "User"}</strong>
                        <small>{member.email || member.role || ""}</small>
                      </div>
                      <span className={member.isOnline ? "chat-member-status is-online" : "chat-member-status"}>
                        <span className={`chat-status-dot ${member.isOnline ? "is-online" : ""}`} />
                        {getMemberStatus(member)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="chat-thread__messages">
              {pagination.hasMore && <button className="chat-load-more" onClick={() => loadMoreMessages(selectedConversation._id)}>Load More</button>}
              {messages.map(m => {
                const isOwn = m.sender?._id === currentUserId;
                return (
                  <article 
                    id={`msg-${m._id}`} 
                    key={m._id} 
                    className={`chat-bubble ${isOwn ? "chat-bubble--own" : ""} ${m.isDeleted ? "is-deleted" : ""}`} 
                    data-deleted={m.isDeleted ? "true" : "false"}
                    style={{ position: "relative" }}
                    onClick={() => {
                      if (isMobile) {
                        setActiveMobileActionMenuMessageId(
                          activeMobileActionMenuMessageId === m._id ? null : m._id
                        );
                      }
                    }}
                  >
                    {!isOwn && <div className="chat-avatar chat-avatar--small">{getInitials(m.sender?.name)}</div>}
                    <div className="chat-bubble__body">
                      {/* Action Menu (Desktop Hover + Mobile Click trigger) */}
                      {!m.isDeleted && (
                        <div 
                          className="chat-bubble-actions-wrapper"
                          style={{
                            opacity: (activeMobileActionMenuMessageId === m._id) ? 1 : undefined,
                            pointerEvents: (activeMobileActionMenuMessageId === m._id) ? "auto" : undefined,
                            transform: (activeMobileActionMenuMessageId === m._id) ? "translateY(0)" : undefined,
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setReplyToMessage(m); }}
                            title="Reply"
                          >
                            <CornerUpLeft size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReactionPickerMessageId(
                                activeReactionPickerMessageId === m._id ? null : m._id
                              );
                            }}
                            title="React"
                          >
                            <Smile size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setForwardingMessage(m);
                              setSelectedForwardConvIds([]);
                              setShowForwardModal(true);
                            }}
                            title="Forward"
                          >
                            <Share2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingMessage(m);
                              setDeleteOption("me");
                              setShowDeleteModal(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                      {/* Reactions Floating Picker */}
                      {activeReactionPickerMessageId === m._id && (
                        <div 
                          ref={reactionPickerRef} 
                          className="chat-bubble-reaction-picker"
                          style={{
                            position: "absolute",
                            bottom: "100%",
                            left: isOwn ? "auto" : "0",
                            right: isOwn ? "0" : "auto",
                            background: "#1c1c24",
                            border: "1px solid var(--color-border, #2d2d34)",
                            borderRadius: "18px",
                            padding: "4px 8px",
                            display: "flex",
                            gap: "6px",
                            zIndex: 100,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                            marginBottom: "4px"
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(m._id, emoji)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "16px",
                                padding: "2px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.1s ease"
                              }}
                              className="chat-reaction-emoji-btn"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quoted Quoting Reply */}
                      {m.replyTo && !m.isDeleted && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            const originalMsgEl = document.getElementById(`msg-${m.replyTo._id}`);
                            if (originalMsgEl) {
                              originalMsgEl.scrollIntoView({ behavior: "smooth", block: "center" });
                              originalMsgEl.classList.add("chat-bubble--highlight");
                              setTimeout(() => {
                                originalMsgEl.classList.remove("chat-bubble--highlight");
                              }, 2000);
                            }
                          }}
                          style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            padding: "6px 10px", 
                            background: "rgba(255, 255, 255, 0.05)", 
                            borderLeft: "3px solid var(--color-accent, #ff8c00)", 
                            borderRadius: "4px", 
                            marginBottom: "8px", 
                            cursor: "pointer",
                            fontSize: "11px",
                            maxWidth: "100%",
                            overflow: "hidden"
                          }}
                        >
                          <strong style={{ color: "var(--color-accent, #ff8c00)", fontSize: "10px" }}>
                            {m.replyTo.senderName || "User"}
                          </strong>
                          <span style={{ color: "var(--color-text-muted)", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", display: "block" }}>
                            {m.replyTo.messageType === "image" 
                              ? "Photo" 
                              : m.replyTo.messageType === "document" || m.replyTo.messageType === "archive" 
                              ? `📄 ${m.replyTo.fileName || "File"}` 
                              : m.replyTo.messageText}
                          </span>
                        </div>
                      )}

                      {m.isForwarded && !m.isDeleted && (
                        <span style={{ display: "block", fontSize: "10px", fontStyle: "italic", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                          Forwarded
                        </span>
                      )}

                      {selectedConversation.isGroup && !isOwn && <strong className="chat-bubble__sender">{m.sender?.name || "User"}</strong>}
                      {m.fileUrl && !m.isDeleted && (
                        <div className="chat-bubble__file-attachment" style={{ marginBottom: m.rawMessageText ? "8px" : "0px" }}>
                          {m.messageType === "image" ? (
                            <div className="chat-file-image">
                              <ChatImage
                                src={m.fileUrl}
                                alt={m.fileName}
                                style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "6px", cursor: "pointer", display: "block", marginBottom: "4px", objectFit: "contain" }}
                                onClick={(blobUrl) => {
                                  setLightboxImage(blobUrl);
                                  setLightboxTitle(m.fileName);
                                }}
                              />
                              <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "10px", wordBreak: "break-all" }} title={m.fileName}>{m.fileName}</small>
                            </div>
                          ) : m.messageType === "archive" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "var(--color-bg-alt, #18181c)", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border, #2d2d34)", minWidth: "200px", maxWidth: "260px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "20px" }}>🗜</span>
                                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                  <strong style={{ fontSize: "12px", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.fileName}>{m.fileName}</strong>
                                  <small style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                                    {m.fileSize > 1024 * 1024 
                                      ? `${(m.fileSize / (1024 * 1024)).toFixed(2)} MB`
                                      : `${(m.fileSize / 1024).toFixed(1)} KB`}
                                  </small>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(m._id, m.fileUrl, m.fileName, "attachment")}
                                disabled={downloadingFileId === m._id}
                                style={{ fontSize: "11px", padding: "4px 8px", minHeight: "auto", marginTop: "4px", alignSelf: "flex-start", border: "1px solid var(--color-border, #2d2d34)", color: "var(--color-text)", background: "transparent", cursor: downloadingFileId === m._id ? "not-allowed" : "pointer", textDecoration: "none", borderRadius: "4px", textAlign: "center" }}
                              >
                                {downloadingFileId === m._id ? "Downloading..." : "Download"}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "var(--color-bg-alt, #18181c)", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border, #2d2d34)", minWidth: "200px", maxWidth: "260px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "20px" }}>📄</span>
                                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                  <strong style={{ fontSize: "12px", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.fileName}>{m.fileName}</strong>
                                  <small style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                                    {m.fileSize > 1024 * 1024 
                                      ? `${(m.fileSize / (1024 * 1024)).toFixed(2)} MB`
                                      : `${(m.fileSize / 1024).toFixed(1)} KB`}
                                  </small>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                                {isViewable(m.fileName) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(m._id, m.fileUrl, m.fileName, "inline")}
                                    disabled={downloadingFileId === m._id}
                                    style={{ fontSize: "11px", padding: "4px 8px", minHeight: "auto", border: "1px solid var(--color-border, #2d2d34)", color: "var(--color-text)", background: "transparent", cursor: downloadingFileId === m._id ? "not-allowed" : "pointer", borderRadius: "4px" }}
                                  >
                                    View
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(m._id, m.fileUrl, m.fileName, "attachment")}
                                  disabled={downloadingFileId === m._id}
                                  style={{ fontSize: "11px", padding: "4px 8px", minHeight: "auto", border: "1px solid var(--color-border, #2d2d34)", color: "var(--color-text)", background: "transparent", cursor: downloadingFileId === m._id ? "not-allowed" : "pointer", borderRadius: "4px" }}
                                >
                                  {downloadingFileId === m._id ? "..." : "Download"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {m.isDeleted ? (
                        <p style={{ fontStyle: "italic", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
                          <span>🗑</span>
                          This message was deleted.
                        </p>
                      ) : (
                        m.rawMessageText && <p>{m.rawMessageText}</p>
                      )}

                      {/* Reactions Chips Display */}
                      {Array.isArray(m.reactions) && m.reactions.length > 0 && !m.isDeleted && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }} onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const groups = {};
                            m.reactions.forEach(r => {
                              groups[r.emoji] = groups[r.emoji] || [];
                              groups[r.emoji].push(r.userId);
                            });
                            return Object.entries(groups).map(([emoji, userIds]) => {
                              const hasReacted = userIds.includes(currentUserId);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(m._id, emoji)}
                                  title={userIds.length === 1 ? "1 reaction" : `${userIds.length} reactions`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "2px 6px",
                                    fontSize: "10px",
                                    borderRadius: "12px",
                                    border: "1px solid",
                                    borderColor: hasReacted ? "var(--color-accent, #ff8c00)" : "var(--color-border, #2d2d34)",
                                    background: hasReacted ? "rgba(255, 140, 0, 0.15)" : "var(--color-bg-alt, #18181c)",
                                    color: hasReacted ? "var(--color-accent, #ff8c00)" : "var(--color-text)",
                                    cursor: "pointer"
                                  }}
                                >
                                  <span>{emoji}</span>
                                  <span>{userIds.length}</span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      )}

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

            <form className="chat-composer" onSubmit={handleSubmit} style={{ position: "relative" }}>
              {/* Reply Preview Area */}
              {replyToMessage && (
                <div className="chat-composer-reply-preview" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-bg-alt, #18181c)", borderBottom: "1px solid var(--color-border, #2d2d34)", borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-accent, #ff8c00)", fontWeight: "600" }}>
                      Replying to {replyToMessage.sender?.name || "User"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {replyToMessage.messageType === "image" 
                        ? "Photo" 
                        : replyToMessage.messageType === "document" || replyToMessage.messageType === "archive" 
                        ? `📄 ${replyToMessage.fileName || "File"}` 
                        : replyToMessage.rawMessageText || replyToMessage.messageText}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setReplyToMessage(null)} 
                    style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Attachment Preview Area */}
              {(selectedFile || uploadedFileData) && (
                <div className="chat-upload-previews">
                  <div className="chat-upload-preview">
                    {uploading ? (
                      <div style={{ color: "var(--color-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>⏳ Uploading {selectedFile?.name}... ({uploadProgress || 0}%)</span>
                      </div>
                    ) : uploadedFileData?.messageType === "image" ? (
                      <div className="chat-preview-image">
                        <ChatImage src={uploadedFileData.fileUrl} alt="Upload Preview" onClick={() => {}} />
                        <span style={{ color: "var(--color-text)", fontWeight: "500" }}>{uploadedFileData.fileName}</span>
                      </div>
                    ) : (
                      <div className="chat-preview-doc">
                        <span>📄 {uploadedFileData?.fileName || selectedFile?.name}</span>
                        {uploadedFileData && (
                          <small>
                            {uploadedFileData.fileSize > 1024 * 1024
                              ? `${(uploadedFileData.fileSize / (1024 * 1024)).toFixed(2)} MB`
                              : `${(uploadedFileData.fileSize / 1024).toFixed(1)} KB`}
                          </small>
                        )}
                      </div>
                    )}
                    <button type="button" onClick={handleRemoveAttachment} className="chat-preview-close" style={{ cursor: "pointer" }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="chat-emoji-picker">
                  <div className="chat-emoji-picker__header">
                    <span>Select Emoji</span>
                    <button type="button" onClick={() => setShowEmojiPicker(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="chat-emoji-picker__grid">
                    {COMMON_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="chat-emoji-btn"
                        onClick={() => insertEmoji(emoji)}
                        style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px" }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="chat-composer__row" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
                
                {/* [ Attachment (+) ] */}
                <button
                  type="button"
                  className="chat-composer-action-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ opacity: uploading ? 0.5 : 1, cursor: uploading ? "not-allowed" : "pointer" }}
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>

                {/* [ Emoji (😊) ] */}
                <button
                  type="button"
                  ref={emojiButtonRef}
                  className="chat-composer-action-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Insert emoji"
                  style={{ cursor: "pointer" }}
                >
                  <Smile size={20} />
                </button>

                <textarea
                  ref={composerRef}
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
                  style={{ flex: 1 }}
                />
                <button type="submit" className="chat-send-btn" disabled={uploading} style={{ opacity: uploading ? 0.5 : 1, cursor: uploading ? "not-allowed" : "pointer" }}>
                  <Send size={18} />
                </button>
              </div>
              {errorMessage && <p className="chat-error" style={{ color: "#ff4444", fontSize: "11px", margin: "4px 12px 0" }}>{errorMessage}</p>}
            </form>

            {/* Custom Embedded CSS Style Block */}
            <style>{`
              .chat-emoji-picker {
                position: absolute;
                bottom: 60px;
                left: 10px;
                background: var(--color-bg-surface, #1e1e24);
                border: 1px solid var(--color-border, #2d2d34);
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
                width: 280px;
                max-height: 240px;
                z-index: 100;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: chatFadeIn 0.15s ease-out;
              }
              @keyframes chatFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .chat-emoji-picker__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid var(--color-border, #2d2d34);
                background: var(--color-bg-alt, #18181c);
              }
              .chat-emoji-picker__header span {
                font-size: 12px;
                font-weight: 600;
                color: var(--color-text, #ffffff);
              }
              .chat-emoji-picker__header button {
                background: none;
                border: none;
                color: var(--color-text-muted, #a0a0ab);
                cursor: pointer;
              }
              .chat-emoji-picker__header button:hover {
                color: var(--color-text, #ffffff);
              }
              .chat-emoji-picker__grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 4px;
                padding: 8px;
                overflow-y: auto;
                max-height: 190px;
              }
              .chat-emoji-btn {
                background: none;
                border: none;
                font-size: 20px;
                padding: 6px;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.1s;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--color-text, #ffffff);
              }
              .chat-emoji-btn:hover {
                background: var(--color-bg-alt, #18181c);
              }
              .chat-composer-action-btn {
                background: none;
                border: none;
                color: var(--color-text-muted, #a0a0ab);
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
              }
              .chat-composer-action-btn:hover:not(:disabled) {
                color: var(--color-accent, #ff7b00);
                background: var(--color-bg-alt, #18181c);
              }
              .chat-upload-previews {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 8px 12px;
                background: var(--color-bg-alt, #18181c);
                border-top: 1px solid var(--color-border, #2d2d34);
                width: 100%;
              }
              .chat-upload-preview {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--color-bg-surface, #1e1e24);
                border: 1px solid var(--color-border, #2d2d34);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                width: 100%;
                box-sizing: border-box;
              }
              .chat-preview-doc {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--color-text, #ffffff);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 80%;
              }
              .chat-preview-doc small {
                color: var(--color-text-muted, #a0a0ab);
              }
              .chat-preview-image {
                display: flex;
                align-items: center;
                gap: 8px;
                overflow: hidden;
                max-width: 80%;
              }
              .chat-preview-image img {
                width: 32px;
                height: 32px;
                object-fit: cover;
                border-radius: 4px;
                flex-shrink: 0;
              }
              .chat-preview-image span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .chat-preview-close {
                background: none;
                border: none;
                color: var(--color-text-muted, #a0a0ab);
                cursor: pointer;
                padding: 2px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .chat-preview-close:hover {
                color: var(--color-text, #ffffff);
                background: var(--color-bg-alt, #18181c);
              }
              .chat-lightbox {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: chatFadeIn 0.2s ease-out;
              }
              .chat-lightbox__close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: none;
                color: #fff;
                padding: 10px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .chat-lightbox img {
                max-width: 90%;
                max-height: 80%;
                border-radius: 8px;
                box-shadow: 0 5px 25px rgba(0,0,0,0.5);
                object-fit: contain;
              }
              .chat-lightbox__title {
                margin-top: 15px;
                color: #fff;
                font-size: 14px;
                font-weight: 500;
              }
              .chat-bubble--highlight {
                animation: highlightFlash 2s ease-out;
              }
              @keyframes highlightFlash {
                0% { background: rgba(255, 140, 0, 0.4); }
                100% { background: transparent; }
              }
              .chat-bubble-actions-wrapper {
                position: absolute;
                top: -12px;
                right: 12px;
                background: #1c1c24;
                border: 1px solid var(--color-border, #2d2d34);
                border-radius: 12px;
                padding: 2px 6px;
                display: flex;
                gap: 4px;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s ease;
                z-index: 15;
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                transform: translateY(4px);
              }
              .chat-bubble:hover .chat-bubble-actions-wrapper {
                opacity: 1;
                pointer-events: auto;
                transform: translateY(0);
              }
              .chat-bubble-actions-wrapper button {
                background: none;
                border: none;
                color: var(--color-text-muted, #a0a0ab);
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: color 0.1s, background-color 0.1s;
              }
              .chat-bubble-actions-wrapper button:hover {
                color: var(--color-accent, #ff8c00);
                background-color: var(--color-bg-hover);
              }
              .chat-reaction-emoji-btn:hover {
                transform: scale(1.3);
              }
              @keyframes chatSlideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>

            {/* Custom Lightbox Image Viewer Overlay */}
            {lightboxImage && (
              <div className="chat-lightbox" onClick={() => setLightboxImage(null)}>
                <button
                  type="button"
                  className="chat-lightbox__close"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(null);
                  }}
                >
                  <X size={20} />
                </button>
                <img
                  src={lightboxImage}
                  alt="Full preview"
                  onClick={(e) => e.stopPropagation()}
                />
                {lightboxTitle && (
                  <span className="chat-lightbox__title">{lightboxTitle}</span>
                )}
              </div>
            )}

            {/* Forward Message Modal Overlay */}
            {showForwardModal && forwardingMessage && (
              <div 
                style={{
                  position: "fixed",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "rgba(0, 0, 0, 0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10000,
                  padding: "16px"
                }}
                onClick={() => setShowForwardModal(false)}
              >
                <div 
                  style={{
                    background: "var(--color-bg-elevated, #1c1c24)",
                    border: "1px solid var(--color-border, #2d2d34)",
                    borderRadius: "12px",
                    width: "100%",
                    maxWidth: "460px",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "85vh",
                    boxShadow: "var(--shadow-lg)",
                    animation: "chatFadeIn 0.2s ease-out"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--color-border, #2d2d34)" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "var(--color-text, #ffffff)", fontWeight: "600" }}>Forward Message</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowForwardModal(false)}
                      style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ padding: "12px 20px", background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--color-border, #2d2d34)" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Content Preview:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {forwardingMessage.messageType === "image" 
                        ? "📷 Photo" 
                        : forwardingMessage.messageType === "document" || forwardingMessage.messageType === "archive" 
                        ? `📄 ${forwardingMessage.fileName || "File"}` 
                        : forwardingMessage.rawMessageText || forwardingMessage.messageText}
                    </p>
                  </div>

                  <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border, #2d2d34)" }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <Search size={14} style={{ position: "absolute", left: "10px", color: "var(--color-text-muted)" }} />
                      <input
                        type="text"
                        placeholder="Search conversation..."
                        value={forwardSearch}
                        onChange={(e) => setForwardSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px 8px 32px",
                          background: "var(--color-bg-input, #13131c)",
                          border: "1px solid var(--color-border, #2d2d34)",
                          borderRadius: "6px",
                          color: "var(--color-text)",
                          fontSize: "13px",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
                    {conversations
                      .filter(c => getConversationTitle(c).toLowerCase().includes(forwardSearch.toLowerCase()))
                      .map(c => {
                        const isSelected = selectedForwardConvIds.includes(c._id);
                        return (
                          <div 
                            key={c._id}
                            onClick={() => handleToggleSelectConv(c._id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              background: isSelected ? "rgba(255, 140, 0, 0.08)" : "transparent",
                              transition: "background 0.1s"
                            }}
                            className="chat-forward-item-row"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div className="chat-avatar chat-avatar--small" style={{ margin: 0 }}>
                                {c.isGroup ? <Users size={14} /> : getInitials(c.counterpart?.name)}
                              </div>
                              <span style={{ fontSize: "13px", color: isSelected ? "var(--color-accent, #ff8c00)" : "var(--color-text)", fontWeight: isSelected ? "600" : "400" }}>
                                {getConversationTitle(c)}
                              </span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ accentColor: "var(--color-accent, #ff8c00)", cursor: "pointer" }}
                            />
                          </div>
                        );
                      })
                    }
                    {conversations.filter(c => getConversationTitle(c).toLowerCase().includes(forwardSearch.toLowerCase())).length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                        No conversations found
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border, #2d2d34)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowForwardModal(false)}
                      style={{
                        padding: "8px 16px",
                        background: "transparent",
                        border: "1px solid var(--color-border, #2d2d34)",
                        borderRadius: "6px",
                        color: "var(--color-text)",
                        fontSize: "13px",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleForwardMessage}
                      disabled={selectedForwardConvIds.length === 0 || isForwardingLoading}
                      style={{
                        padding: "8px 16px",
                        background: selectedForwardConvIds.length === 0 ? "rgba(255, 140, 0, 0.4)" : "var(--color-accent, #ff8c00)",
                        border: "none",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: selectedForwardConvIds.length === 0 || isForwardingLoading ? "not-allowed" : "pointer"
                      }}
                    >
                      {isForwardingLoading ? "Forwarding..." : `Forward (${selectedForwardConvIds.length})`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Message Modal */}
            {showDeleteModal && deletingMessage && (() => {
              const isSender = (
                deletingMessage.sender?._id === currentUserId ||
                deletingMessage.senderId?._id === currentUserId ||
                deletingMessage.senderId === currentUserId
              );
              const isWithinTimeLimit = Date.now() - new Date(deletingMessage.createdAt).getTime() <= 24 * 60 * 60 * 1000;
              const canDeleteForEveryone = isSender && isWithinTimeLimit;

              return (
                <div 
                  style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0, 0, 0, 0.6)",
                    display: "flex",
                    alignItems: isMobile ? "flex-end" : "center",
                    justifyContent: "center",
                    zIndex: 10000,
                    padding: isMobile ? "0" : "16px"
                  }}
                  onClick={() => setShowDeleteModal(false)}
                >
                  <div 
                    style={isMobile ? {
                      background: "var(--color-bg-elevated, #1c1c24)",
                      borderTop: "1px solid var(--color-border, #2d2d34)",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                      width: "100%",
                      boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.2)",
                      animation: "chatSlideUp 0.2s ease-out",
                      padding: "20px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px"
                    } : {
                      background: "var(--color-bg-elevated, #1c1c24)",
                      border: "1px solid var(--color-border, #2d2d34)",
                      borderRadius: "12px",
                      width: "100%",
                      maxWidth: "340px",
                      boxShadow: "var(--shadow-lg)",
                      animation: "chatFadeIn 0.15s ease-out",
                      padding: "20px"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "var(--color-text, #ffffff)", fontWeight: "600" }}>
                      Delete message
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {canDeleteForEveryone && (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm("Delete this message for everyone?")) {
                                try {
                                  setIsDeletingLoading(true);
                                  await deleteMessageForEveryone(deletingMessage._id);
                                  showToast("Message deleted for everyone");
                                  setShowDeleteModal(false);
                                  setDeletingMessage(null);
                                } catch (err) {
                                  const msg = err.response?.data?.message || "Failed to delete message";
                                  showToast(msg);
                                } finally {
                                  setIsDeletingLoading(false);
                                }
                              }
                            }}
                            disabled={isDeletingLoading}
                            style={{
                              width: "100%",
                              padding: "10px 14px 4px 14px",
                              background: "transparent",
                              border: "none",
                              borderRadius: "6px",
                              color: "#ff4d4f",
                              fontSize: "14px",
                              fontWeight: "500",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 77, 79, 0.08)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            Delete for everyone
                          </button>
                          <div style={{ padding: "0 14px 8px 14px", fontSize: "11px", color: "var(--color-text-muted, #8e8e93)", fontStyle: "italic" }}>
                            Delete for everyone is available for 24 hours.
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setIsDeletingLoading(true);
                            await deleteMessageForMe(deletingMessage._id);
                            showToast("Message deleted for you");
                            setShowDeleteModal(false);
                            setDeletingMessage(null);
                          } catch (err) {
                            const msg = err.response?.data?.message || "Failed to delete message";
                            showToast(msg);
                          } finally {
                            setIsDeletingLoading(false);
                          }
                        }}
                        disabled={isDeletingLoading}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "6px",
                          color: "var(--color-text, #ffffff)",
                          fontSize: "14px",
                          fontWeight: "500",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        Delete for me
                      </button>

                      {isSender && !isWithinTimeLimit && (
                        <div style={{ padding: "4px 14px", fontSize: "11px", color: "var(--color-text-muted, #8e8e93)", fontStyle: "italic" }}>
                          Delete for everyone is no longer available.
                        </div>
                      )}

                      <div style={{ height: "1px", background: "var(--color-border, #2d2d34)", margin: "8px 0" }} />

                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(false)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "6px",
                          color: "var(--color-text-muted, #8e8e93)",
                          fontSize: "14px",
                          fontWeight: "500",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
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
