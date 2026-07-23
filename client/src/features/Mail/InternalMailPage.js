import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Edit3, Inbox, FileText, Send, Trash2, RefreshCw,
  Search, Star, Paperclip, ChevronLeft, Download, Eye,
  Trash, ArrowLeft, Loader2, AlertCircle, Sparkles, Check, CheckSquare, Square,
  CornerUpLeft
} from "lucide-react";
import { internalMailApi } from "./internalMailApi";
import { getAppSocket } from "../../services/socket";
import axios from "axios";
import "./internalMail.css";

export default function InternalMailPage() {
  const [currentFolder, setCurrentFolder] = useState("inbox"); // inbox, drafts, sent, deleted
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Counts
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);

  // Selection / Detail State
  const [selectedMailId, setSelectedMailId] = useState(null);
  const [selectedMail, setSelectedMail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all, starred, unread

  // Compose State
  const [composeMode, setComposeMode] = useState(false); // false, "new", "edit_draft"
  const [draftMailId, setDraftMailId] = useState(null);
  const [replyToId, setReplyToId] = useState(null);
  const [originalMailQuote, setOriginalMailQuote] = useState(null);

  // Compose Form Fields
  const [recipientsSearch, setRecipientsSearch] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Directory for Compose
  const [userDirectory, setUserDirectory] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Mobile View Routing State
  const [mobileView, setMobileView] = useState("list"); // sidebar, list, detail

  const socketRef = useRef(null);

  // Load user directory once
  useEffect(() => {
    internalMailApi.getUsers()
      .then(res => {
        setUserDirectory(res.data?.data || []);
      })
      .catch(err => console.error("Failed to load user directory:", err));
  }, []);

  // Fetch mail count
  const fetchCounts = async () => {
    try {
      const unreadRes = await internalMailApi.getUnreadCount();
      setInboxUnreadCount(unreadRes.data?.data?.unreadCount || 0);

      const draftsRes = await internalMailApi.getDrafts();
      setDraftsCount(draftsRes.data?.data?.length || 0);
    } catch (err) {
      console.error("Failed to fetch mail counts:", err);
    }
  };

  // Fetch list of current folder
  const fetchFolderList = async (folder = currentFolder) => {
    try {
      setLoading(true);
      setError("");
      let res;
      if (folder === "inbox") res = await internalMailApi.getInbox();
      else if (folder === "sent") res = await internalMailApi.getSent();
      else if (folder === "drafts") res = await internalMailApi.getDrafts();
      else if (folder === "deleted") res = await internalMailApi.getDeleted();

      setMails(res.data?.data || []);
      fetchCounts();
    } catch (err) {
      setError("Failed to load announcements / emails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderList(currentFolder);
    setComposeMode(false);
    setSelectedMailId(null);
    setSelectedMail(null);
  }, [currentFolder]);

  // Load single mail detail
  useEffect(() => {
    if (selectedMailId) {
      setLoadingDetail(true);
      internalMailApi.getMail(selectedMailId)
        .then(res => {
          setSelectedMail(res.data?.data || null);
          // If in inbox, mark read local state update
          if (currentFolder === "inbox") {
            setMails(prev => prev.map(m => m._id === selectedMailId ? { ...m, readBy: [...(m.readBy || []), localStorage.getItem("userId")] } : m));
            fetchCounts();
          }
        })
        .catch(() => {
          setError("Failed to load email content.");
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  }, [selectedMailId]);

  // Socket.IO hook
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = getAppSocket(token);
    socketRef.current = socket;

    if (socket) {
      const handleNewMail = () => {
        fetchFolderList();
      };
      socket.on("new_mail", handleNewMail);

      return () => {
        socket.off("new_mail", handleNewMail);
      };
    }
  }, [currentFolder]);

  // Filter and search computation
  const filteredMails = useMemo(() => {
    let list = mails;

    // Filter type
    if (activeFilter === "starred") {
      const myId = localStorage.getItem("userId");
      list = list.filter(m => m.starredBy?.includes(myId));
    } else if (activeFilter === "unread") {
      const myId = localStorage.getItem("userId");
      list = list.filter(m => !m.readBy?.includes(myId));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => {
        const senderName = m.sender?.name || "";
        const subjectStr = m.subject || "";
        const bodyStr = m.body || "";
        return senderName.toLowerCase().includes(q) ||
          subjectStr.toLowerCase().includes(q) ||
          bodyStr.toLowerCase().includes(q);
      });
    }

    return list;
  }, [mails, activeFilter, searchQuery]);

  // User picker dropdown auto-complete
  const filteredUserDirectory = useMemo(() => {
    if (!recipientsSearch.trim()) return [];
    const q = recipientsSearch.toLowerCase().trim();
    return userDirectory.filter(u =>
      u._id !== localStorage.getItem("userId") &&
      !selectedRecipients.some(sel => sel._id === u._id) &&
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [recipientsSearch, userDirectory, selectedRecipients]);

  // Mail star / unstar handler
  const handleToggleStar = async (e, mailId, currentStarred) => {
    e.stopPropagation();
    try {
      const nextStar = !currentStarred;
      const res = await internalMailApi.toggleStar(mailId, nextStar);
      if (res.data?.success) {
        const myId = localStorage.getItem("userId");
        // Update local items
        setMails(prev => prev.map(m => {
          if (m._id === mailId) {
            const starredBy = m.starredBy || [];
            return {
              ...m,
              starredBy: nextStar
                ? [...starredBy, myId]
                : starredBy.filter(id => id !== myId)
            };
          }
          return m;
        }));

        if (selectedMail && selectedMail._id === mailId) {
          const starredBy = selectedMail.starredBy || [];
          setSelectedMail(prev => ({
            ...prev,
            starredBy: nextStar
              ? [...starredBy, myId]
              : starredBy.filter(id => id !== myId)
          }));
        }
      }
    } catch (err) {
      console.error("Star toggle failed:", err);
    }
  };

  // Soft delete handler
  const handleDeleteMail = async (mailId) => {
    try {
      const res = await internalMailApi.softDelete(mailId);
      if (res.data?.success) {
        setMails(prev => prev.filter(m => m._id !== mailId));
        setSelectedMail(null);
        setSelectedMailId(null);
        fetchCounts();
        if (mobileView === "detail") setMobileView("list");
      }
    } catch (err) {
      alert("Failed to delete email.");
    }
  };

  // Restore deleted mail handler
  const handleRestoreMail = async (mailId) => {
    try {
      const res = await internalMailApi.restoreMail(mailId);
      if (res.data?.success) {
        setMails(prev => prev.filter(m => m._id !== mailId));
        setSelectedMail(null);
        setSelectedMailId(null);
        fetchCounts();
        if (mobileView === "detail") setMobileView("list");
      }
    } catch (err) {
      alert("Failed to restore email.");
    }
  };

  // Secure attachment download proxy helper
  const handleDownloadAttachment = async (attachmentId, originalname) => {
    try {
      const url = internalMailApi.getDownloadUrl(selectedMail._id, attachmentId);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", originalname);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download attachment.");
    }
  };

  // Compose / draft actions
  const handleComposeNew = () => {
    setComposeMode("new");
    setDraftMailId(null);
    setReplyToId(null);
    setOriginalMailQuote(null);
    setSelectedRecipients([]);
    setSubject("");
    setBody("");
    setFiles([]);
    setMobileView("detail");
  };

  const handleReply = (original) => {
    setComposeMode("new");
    setDraftMailId(null);
    setReplyToId(original._id);
    setOriginalMailQuote(original);

    // Preselect original sender
    setSelectedRecipients([original.sender]);

    // Format subject with exactly one "Re:" prefix
    const originalSubject = original.subject || "";
    const startsWithRe = /^Re:\s*/i.test(originalSubject);
    setSubject(startsWithRe ? originalSubject : `Re: ${originalSubject}`);

    setBody("");
    setFiles([]);
    setMobileView("detail");
  };

  const handleEditDraft = (draft) => {
    setComposeMode("edit_draft");
    setDraftMailId(draft._id);
    setSubject(draft.subject || "");
    setBody(draft.body || "");
    setFiles([]);

    if (draft.replyTo) {
      setReplyToId(draft.replyTo._id || draft.replyTo);
      setOriginalMailQuote(draft.replyTo);
    } else {
      setReplyToId(null);
      setOriginalMailQuote(null);
    }

    // Map recipient IDs to full objects
    const resolvedRecs = (draft.recipients || []).map(r => {
      const found = userDirectory.find(u => u._id === (r._id || r));
      return found || { _id: (r._id || r), name: r.name || "Unknown User", email: r.email || "" };
    });
    setSelectedRecipients(resolvedRecs);
    setMobileView("detail");
  };

  const handleFileChange = (e) => {
    const chosenFiles = Array.from(e.target.files);
    // Limit to max 5 files
    setFiles(prev => [...prev, ...chosenFiles].slice(0, 5));
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitMail = async (e, shouldSend = true) => {
    e.preventDefault();
    if (shouldSend && selectedRecipients.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      selectedRecipients.forEach(r => formData.append("recipients", r._id));
      formData.append("subject", subject);
      formData.append("body", body);
      files.forEach(f => formData.append("files", f));

      if (replyToId) {
        formData.append("replyTo", replyToId);
      }

      let res;
      if (shouldSend) {
        if (composeMode === "edit_draft" && draftMailId) {
          formData.append("draftId", draftMailId);
        }
        res = await internalMailApi.sendMail(formData);
      } else {
        // Save as draft
        if (composeMode === "edit_draft" && draftMailId) {
          formData.append("status", "draft");
          res = await internalMailApi.updateDraft(draftMailId, formData);
        } else {
          res = await internalMailApi.saveDraft(formData);
        }
      }

      if (res.data?.success) {
        setComposeMode(false);
        setDraftMailId(null);
        setSelectedRecipients([]);
        setSubject("");
        setBody("");
        setFiles([]);
        fetchFolderList(currentFolder);
        if (mobileView === "detail") setMobileView("list");
      } else {
        alert(res.data?.message || "Operation failed.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Date formatting helpers
  const formatMailDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  return (
    <div className="netmail-container">
      <div className="netmail-layout">

        {/* Sidebar Column */}
        <aside className={`netmail-sidebar ${mobileView === "sidebar" ? "active-mobile" : ""}`}>
          <div className="netmail-logo-area">
            <img src="/mailLogo.png" alt="NETMAIL" style={{ height: "26px", objectFit: "contain" }} />
            <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-accent)", textDecoration: "none" }}>
              <ArrowLeft size={12} /> Back
            </Link>
          </div>

          <button type="button" className="netmail-compose-btn" onClick={handleComposeNew}>
            <Edit3 size={16} />
            <span>Compose</span>
          </button>

          <nav className="netmail-menu">
            <div className={`netmail-menu-item ${currentFolder === "inbox" ? "active" : ""}`} onClick={() => { setCurrentFolder("inbox"); setMobileView("list"); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Inbox size={16} /> Inbox</span>
              {inboxUnreadCount > 0 && <span className="netmail-badge">{inboxUnreadCount}</span>}
            </div>

            <div className={`netmail-menu-item ${currentFolder === "drafts" ? "active" : ""}`} onClick={() => { setCurrentFolder("drafts"); setMobileView("list"); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><FileText size={16} /> Drafts</span>
              {draftsCount > 0 && <span className="netmail-badge">{draftsCount}</span>}
            </div>

            <div className={`netmail-menu-item ${currentFolder === "sent" ? "active" : ""}`} onClick={() => { setCurrentFolder("sent"); setMobileView("list"); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Send size={16} /> Sent</span>
            </div>

            <div className={`netmail-menu-item ${currentFolder === "deleted" ? "active" : ""}`} onClick={() => { setCurrentFolder("deleted"); setMobileView("list"); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Trash2 size={16} /> Deleted</span>
            </div>
          </nav>
        </aside>

        {/* Mail List Column */}
        <section className={`netmail-list-col ${mobileView === "list" ? "active-mobile" : ""}`}>
          <div className="netmail-list-header">
            <div className="netmail-list-toolbar">
              <button className="netmail-filter-btn md-hidden" onClick={() => setMobileView("sidebar")} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ChevronLeft size={14} /> Menu
              </button>
              <h3 style={{ margin: 0, textTransform: "capitalize", fontSize: "16px" }}>{currentFolder}</h3>
              <button type="button" className="btn-icon" onClick={() => fetchFolderList(currentFolder)} title="Refresh">
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="netmail-search-bar">
              <Search size={14} style={{ opacity: 0.6 }} />
              <input
                placeholder="Search mail..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="netmail-filters">
              <button className={`netmail-filter-btn ${activeFilter === "all" ? "active" : ""}`} onClick={() => setActiveFilter("all")}>All</button>
              <button className={`netmail-filter-btn ${activeFilter === "starred" ? "active" : ""}`} onClick={() => setActiveFilter("starred")}>Starred</button>
              {currentFolder === "inbox" && (
                <button className={`netmail-filter-btn ${activeFilter === "unread" ? "active" : ""}`} onClick={() => setActiveFilter("unread")}>Unread</button>
              )}
            </div>
          </div>

          <div className="netmail-list-scroll">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "40px", alignItems: "center", color: "var(--color-text-muted)" }}>
                <Loader2 className="animate-spin" size={24} />
                <span>Loading messages...</span>
              </div>
            ) : filteredMails.length === 0 ? (
              <div className="netmail-empty-state">
                <Mail size={32} style={{ opacity: 0.2 }} />
                <span className="netmail-empty-title">Folder is empty</span>
                <span style={{ fontSize: "11px", opacity: 0.7 }}>No internal announcements or mails found.</span>
              </div>
            ) : (
              filteredMails.map((item) => {
                const myId = localStorage.getItem("userId");
                const isRead = item.readBy?.includes(myId);
                const isStarred = item.starredBy?.includes(myId);
                const hasAttachment = item.attachments && item.attachments.length > 0;

                const listSender = item.sender?._id === myId ? "Me" : (item.sender?.name || "System");

                return (
                  <div
                    key={item._id}
                    className={`netmail-item-card ${selectedMailId === item._id ? "selected" : ""} ${(!isRead && currentFolder === "inbox") ? "unread" : ""}`}
                    onClick={() => {
                      if (currentFolder === "drafts") {
                        handleEditDraft(item);
                      } else {
                        setComposeMode(false);
                        setSelectedMailId(item._id);
                      }
                      setMobileView("detail");
                    }}
                  >
                    <div className="netmail-card-meta">
                      <span className="netmail-card-sender">{listSender}</span>
                      <span>{formatMailDate(item.createdAt)}</span>
                    </div>
                    <div className="netmail-card-subject" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {hasAttachment && <Paperclip size={12} style={{ opacity: 0.5 }} />}
                      <span>{item.subject || "(No Subject)"}</span>
                    </div>
                    <div className="netmail-card-preview">{item.body || "(Empty content)"}</div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                      <Star
                        size={14}
                        className={`netmail-star-icon ${isStarred ? "starred" : ""}`}
                        onClick={(e) => handleToggleStar(e, item._id, isStarred)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Detail Column / Reader Panel / Compose Interface */}
        <main className={`netmail-detail-col ${mobileView === "detail" ? "active-mobile" : ""}`}>

          {/* Back button for mobile view */}
          <div className="netmail-list-toolbar md-hidden" style={{ padding: "var(--space-2) var(--space-4)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <button className="netmail-filter-btn" onClick={() => setMobileView("list")} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <ChevronLeft size={14} /> Back to list
            </button>
          </div>

          {composeMode ? (
            /* Compose / Edit Draft Form */
            <div className="netmail-compose">
              <div className="netmail-compose-header">
                {composeMode === "new" ? "New Message" : "Edit Draft"}
              </div>

              <form onSubmit={(e) => handleSubmitMail(e, true)} className="netmail-compose-form">
                <div className="netmail-form-row">
                  <label>To</label>
                  <div className="netmail-recipient-picker-wrapper">
                    {selectedRecipients.map((rec) => (
                      <span key={rec._id} className="netmail-recipient-bubble">
                        {rec.name}
                        {!replyToId && (
                          <button type="button" onClick={() => setSelectedRecipients(prev => prev.filter(p => p._id !== rec._id))}>
                            <X size={10} />
                          </button>
                        )}
                      </span>
                    ))}
                    {!replyToId && (
                      <input
                        type="text"
                        className="netmail-recipient-input"
                        placeholder={selectedRecipients.length === 0 ? "Search internal CRM users..." : ""}
                        value={recipientsSearch}
                        onChange={e => {
                          setRecipientsSearch(e.target.value);
                          setShowUserDropdown(true);
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                      />
                    )}
                  </div>

                  {showUserDropdown && filteredUserDirectory.length > 0 && (
                    <div className="netmail-user-dropdown">
                      {filteredUserDirectory.map((user) => (
                        <div
                          key={user._id}
                          className="netmail-dropdown-item"
                          onClick={() => {
                            setSelectedRecipients(prev => [...prev, user]);
                            setRecipientsSearch("");
                            setShowUserDropdown(false);
                          }}
                        >
                          <span className="netmail-dropdown-name">{user.name}</span>
                          <span className="netmail-dropdown-email">{user.email} ({user.role} | {user.department || "No Department"})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="netmail-form-row">
                  <label>Subject</label>
                  <input
                    type="text"
                    className="netmail-form-input"
                    placeholder="Subject line"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="netmail-form-row" style={{ flexGrow: 1 }}>
                  <label>Message</label>
                  <textarea
                    className="netmail-form-textarea"
                    placeholder="Write your email here..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    maxLength={10000}
                    style={{ height: "100%", minHeight: "150px" }}
                  />
                  {originalMailQuote && (
                    <div style={{
                      marginTop: "var(--space-2)",
                      padding: "var(--space-3)",
                      borderTop: "1px dashed var(--color-border)",
                      backgroundColor: "rgba(255, 255, 255, 0.01)",
                      borderRadius: "var(--radius-sm)"
                    }}>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
                        On {new Date(originalMailQuote.createdAt).toLocaleString("en-IN")} at {originalMailQuote.sender?.name || "System"} wrote:
                      </div>
                      <blockquote style={{
                        margin: 0,
                        paddingLeft: "var(--space-3)",
                        borderLeft: "2px solid var(--color-accent)",
                        color: "var(--color-text-secondary)",
                        fontSize: "var(--text-sm)",
                        whiteSpace: "pre-wrap",
                        fontStyle: "italic"
                      }}>
                        {originalMailQuote.body || "(No message body)"}
                      </blockquote>
                    </div>
                  )}
                </div>

                {/* Upload attachment Slot */}
                <div className="netmail-form-row">
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} className="hover-text-primary">
                    <Paperclip size={14} /> Attach File (Max 10MB)
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="netmail-attachment-preview-list" style={{ marginTop: "8px" }}>
                      {files.map((file, idx) => (
                        <div key={idx} className="netmail-attachment-preview-card">
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                          <button type="button" className="btn-icon" onClick={() => handleRemoveFile(idx)} style={{ padding: 0 }}>
                            <Trash size={12} color="var(--color-error)" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="netmail-compose-footer">
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? "Sending..." : "Send"}
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={submitting} onClick={(e) => handleSubmitMail(e, false)}>
                      Save as Draft
                    </button>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => { setComposeMode(false); if (mobileView === "detail") setMobileView("list"); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedMailId && selectedMail ? (
            /* Mail Reader Panel */
            (() => {
              const showReplyButton =
                currentFolder === "inbox" &&
                selectedMail.sender &&
                String(selectedMail.sender._id || selectedMail.sender) !== localStorage.getItem("userId") &&
                selectedMail.status !== "draft" &&
                !selectedMail.deletedBy?.includes(localStorage.getItem("userId"));

              return (
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div className="netmail-detail-header">
                    <div>
                      <h2 className="netmail-detail-subject">{selectedMail.subject || "(No Subject)"}</h2>
                      <div className="netmail-detail-participants">
                        <span>From: <strong>{selectedMail.sender?.name}</strong> &lt;{selectedMail.sender?.email}&gt;</span>
                        <span>To: {selectedMail.recipients?.map(r => r.name).join(", ")}</span>
                      </div>
                    </div>

                    <div className="netmail-detail-time">
                      <span>{new Date(selectedMail.createdAt).toLocaleString("en-IN")}</span>

                      <div className="netmail-detail-actions">
                        {showReplyButton && (
                          <button
                            type="button"
                            className="netmail-action-btn"
                            onClick={() => handleReply(selectedMail)}
                            title="Reply to this mail"
                            aria-label="Reply to this mail"
                            style={{ marginRight: "4px" }}
                          >
                            <CornerUpLeft size={14} />
                          </button>
                        )}

                        <Star
                          size={18}
                          className={`netmail-star-icon ${selectedMail.starredBy?.includes(localStorage.getItem("userId")) ? "starred" : ""}`}
                          onClick={(e) => handleToggleStar(e, selectedMail._id, selectedMail.starredBy?.includes(localStorage.getItem("userId")))}
                        />

                        {currentFolder === "deleted" ? (
                          <button
                            type="button"
                            className="netmail-action-btn"
                            onClick={() => handleRestoreMail(selectedMail._id)}
                            title="Restore Mail"
                          >
                            <RefreshCw size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="netmail-action-btn"
                            onClick={() => handleDeleteMail(selectedMail._id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="netmail-detail-body">
                    {selectedMail.body || <span style={{ fontStyle: "italic", opacity: 0.5 }}>(No content)</span>}
                  </div>

                  {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                    <div className="netmail-attachments">
                      <div className="netmail-attachments-title">Attachments</div>
                      <div className="netmail-attachment-grid">
                        {selectedMail.attachments.map((att) => (
                          <div key={att._id} className="netmail-attachment-card">
                            <div className="netmail-attachment-info">
                              <span className="netmail-attachment-name" title={att.originalname}>{att.originalname}</span>
                              <span className="netmail-attachment-size">{(att.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleDownloadAttachment(att._id, att.originalname)}
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : loadingDetail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "80px", alignItems: "center", color: "var(--color-text-muted)" }}>
              <Loader2 className="animate-spin" size={32} />
              <span>Loading message detail...</span>
            </div>
          ) : (
            <div className="netmail-empty-state">
              <Mail size={48} style={{ opacity: 0.2 }} />
              <span className="netmail-empty-title">No message selected</span>
              <span style={{ fontSize: "12px", opacity: 0.7 }}>Select a conversation from the list to read its content.</span>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}

// Minimal placeholder close icon for recipient bubble
function X({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
