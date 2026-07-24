import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Mail, Edit3, Inbox, FileText, Send, Trash2, RefreshCw, 
  Search, Star, Paperclip, ChevronLeft, Download, Eye, 
  Trash, ArrowLeft, Loader2, CornerUpLeft, Plus, FolderOpen,
  HardDrive, SlidersHorizontal, Moon, Bell, ChevronDown, MoreVertical,
  Sun, Menu
} from "lucide-react";
import { internalMailApi } from "./internalMailApi";
import { getAppSocket } from "../../services/socket";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import "./internalMail.css";

// Helper for consistent initials avatar backgrounds
const getAvatarBg = (name) => {
  const colors = [
    "#9b5de5", // Purple
    "#32d583", // Success Green
    "#57a6ff", // Info Blue
    "#f5b546", // Warning Amber
    "#e8420a", // Netcradus Orange
    "#f15bb5", // Pink
    "#00bbf9", // Cyan
    "#00f5d4"  // Mint
  ];
  let hash = 0;
  const str = name || "System Account";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getFileIconBg = (ext) => {
  const e = (ext || "").toLowerCase();
  if (e === "pdf") return "#ea4335"; // Red
  if (["png", "jpg", "jpeg", "gif"].includes(e)) return "#4285f4"; // Blue
  if (["doc", "docx"].includes(e)) return "#2b579a"; // Word Blue
  if (["xls", "xlsx"].includes(e)) return "#107c41"; // Excel Green
  if (["zip", "rar", "7z"].includes(e)) return "#f4b400"; // Yellow
  return "#757575"; // Grey
};

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
  const [activeFilter, setActiveFilter] = useState("all"); // all, unread, starred

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

  // Mobile view
  const [mobileView, setMobileView] = useState("list"); // sidebar, list, detail

  const socketRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef(null);
  const myUserId = localStorage.getItem("userId") || "";
  const myUserName = localStorage.getItem("userName") || "User";
  const myUserEmail = localStorage.getItem("userEmail") || "user@netcradus.com";
  const myUserRole = localStorage.getItem("userRole") || "Member";

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth > 768 : true;
  });

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resolveSenderName = (item) => {
    if (!item) return "";
    if (currentFolder === "sent") {
      const recNames = (item.recipients || []).map(r => r.fullName || r.name).filter(Boolean).join(", ");
      return recNames ? `To: ${recNames}` : "To: Unknown Recipient";
    } else if (currentFolder === "drafts") {
      const recNames = (item.recipients || []).map(r => r.fullName || r.name).filter(Boolean).join(", ");
      return recNames ? `To: ${recNames}` : "(No Recipient)";
    } else {
      // Inbox / Deleted
      if (!item.sender) {
        // System mail detection
        const subj = (item.subject || "").toLowerCase();
        const bod = (item.body || "").toLowerCase();
        if (subj.includes("system") || bod.includes("system")) {
          return "System";
        }
        return "Unknown Sender";
      }
      
      const name = item.sender.fullName || item.sender.name;
      if (name) {
        if (name.toLowerCase() === "system" || name.toLowerCase() === "system account" || item.sender.role === "system") {
          return "System";
        }
        return name;
      }
      
      if (item.sender.email && item.sender.email.includes("system")) {
        return "System";
      }
      return item.sender.email || "Unknown Sender";
    }
  };

  const resolveInitialsSource = (item) => {
    if (!item) return "";
    if (currentFolder === "sent" || currentFolder === "drafts") {
      const recNames = (item.recipients || []).map(r => r.fullName || r.name).filter(Boolean).join(", ");
      return recNames || "Recipient";
    } else {
      if (!item.sender) {
        const subj = (item.subject || "").toLowerCase();
        const bod = (item.body || "").toLowerCase();
        if (subj.includes("system") || bod.includes("system")) {
          return "System";
        }
        return "Deleted User";
      }
      const name = item.sender.fullName || item.sender.name;
      if (name) {
        if (name.toLowerCase() === "system" || name.toLowerCase() === "system account" || item.sender.role === "system") {
          return "System";
        }
        return name;
      }
      if (item.sender.email && item.sender.email.includes("system")) {
        return "System";
      }
      return item.sender.email || "Unknown User";
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const cleanName = name.replace(/^To:\s*/i, "").trim();
    if (cleanName.toLowerCase() === "hr department") return "HR";
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  const formatDetailDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const datePart = date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    const timePart = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${datePart}, ${timePart}`;
  };

  // Load user directory
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
      setError("Failed to load mails.");
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
          if (currentFolder === "inbox") {
            setMails(prev => prev.map(m => m._id === selectedMailId ? { ...m, readBy: [...(m.readBy || []), myUserId] } : m));
            fetchCounts();
          }
        })
        .catch(() => {
          setError("Failed to load email detail.");
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  }, [selectedMailId]);

  // Socket.IO sync
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

  // Filter and search
  const filteredMails = useMemo(() => {
    let list = mails;

    if (activeFilter === "starred") {
      list = list.filter(m => m.starredBy?.includes(myUserId));
    } else if (activeFilter === "unread") {
      list = list.filter(m => !m.readBy?.includes(myUserId));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => {
        const senderName = m.sender?.name || m.sender?.fullName || "";
        const subjectStr = m.subject || "";
        const bodyStr = m.body || "";
        return senderName.toLowerCase().includes(q) || 
               subjectStr.toLowerCase().includes(q) || 
               bodyStr.toLowerCase().includes(q);
      });
    }

    return list;
  }, [mails, activeFilter, searchQuery, myUserId]);

  // User Picker
  const filteredUserDirectory = useMemo(() => {
    if (!recipientsSearch.trim()) return [];
    const q = recipientsSearch.toLowerCase().trim();
    return userDirectory.filter(u => 
      u._id !== myUserId &&
      !selectedRecipients.some(sel => sel._id === u._id) &&
      ((u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
    );
  }, [recipientsSearch, userDirectory, selectedRecipients, myUserId]);

  // Toggle star
  const handleToggleStar = async (e, mailId, currentStarred) => {
    e.stopPropagation();
    try {
      const nextStar = !currentStarred;
      const res = await internalMailApi.toggleStar(mailId, nextStar);
      if (res.data?.success) {
        setMails(prev => prev.map(m => {
          if (m._id === mailId) {
            const starredBy = m.starredBy || [];
            return {
              ...m,
              starredBy: nextStar 
                ? [...starredBy, myUserId] 
                : starredBy.filter(id => id !== myUserId)
            };
          }
          return m;
        }));

        if (selectedMail && selectedMail._id === mailId) {
          const starredBy = selectedMail.starredBy || [];
          setSelectedMail(prev => ({
            ...prev,
            starredBy: nextStar 
              ? [...starredBy, myUserId] 
              : starredBy.filter(id => id !== myUserId)
          }));
        }
      }
    } catch (err) {
      console.error("Star toggle failed:", err);
    }
  };

  // Delete
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

  // Restore
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

  // Download attachment
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

  // View attachment inline
  const handleViewAttachment = (attachmentId) => {
    const url = internalMailApi.getDownloadUrl(selectedMail._id, attachmentId);
    window.open(url, "_blank");
  };

  // Compose / Reply Triggers
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
    
    const senderObj = original.sender && original.sender._id 
      ? original.sender 
      : { _id: original.sender, name: original.sender?.fullName || original.sender?.name || "System" };

    setSelectedRecipients([senderObj]);
    
    // Subject Re prefix checks
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
    
    const resolvedRecs = (draft.recipients || []).map(r => {
      const found = userDirectory.find(u => u._id === (r._id || r));
      return found || { _id: (r._id || r), name: r.fullName || r.name || "User", email: r.email || "" };
    });
    setSelectedRecipients(resolvedRecs);
    setMobileView("detail");
  };

  const handleFileChange = (e) => {
    const chosenFiles = Array.from(e.target.files);
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

  const formatMailDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const today = new Date();
    
    const isToday = date.toDateString() === today.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
      } else {
        return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
      }
    }
  };

  const currentUserDetail = useMemo(() => {
    return userDirectory.find(u => u._id === myUserId);
  }, [userDirectory, myUserId]);

  return (
    <div className="netmail-container">
      
      {/* 1. CUSTOM TOPBAR HEADER */}
      <header className="netmail-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            type="button" 
            className="netmail-action-btn" 
            onClick={() => setIsSidebarOpen(prev => !prev)}
            aria-expanded={isSidebarOpen}
            aria-controls="netmail-sidebar"
            title="Toggle Menu"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", cursor: "pointer" }}
          >
            <Menu size={18} />
          </button>
          <img 
            src="/mailLogo.png" 
            alt="NETMAIL" 
            className="netmail-brand-logo" 
          />
          <Link to="/dashboard" className="netmail-back-crm">
            <ArrowLeft size={14} /> Back to CRM
          </Link>
        </div>

        <div className="netmail-global-search">
          <Search size={14} style={{ opacity: 0.6 }} />
          <input 
            placeholder="Search emails, contacts or subject..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
          <span className="search-shortcut">⌘K</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button className="netmail-action-btn" title="Theme toggler" onClick={toggleTheme}>
            {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="netmail-user-profile-menu" ref={profileRef} onClick={() => setShowProfileDropdown(!showProfileDropdown)} style={{ position: "relative" }}>
            <div className="netmail-user-avatar" style={{ backgroundColor: "#e8420a" }}>
              {getInitials(myUserName)}
            </div>
            <span className="netmail-user-name">
              {myUserName} <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </span>

            {showProfileDropdown && (
              <div className="netmail-profile-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar" style={{ backgroundColor: "#e8420a" }}>
                    {getInitials(myUserName)}
                  </div>
                  <div className="profile-dropdown-info">
                    <div className="profile-dropdown-name">{myUserName}</div>
                    <div className="profile-dropdown-email">{myUserEmail}</div>
                  </div>
                </div>
                <div className="profile-dropdown-divider"></div>
                <div className="profile-dropdown-item-static">
                  <span>Role:</span> <span>{capitalizeFirstLetter(myUserRole)}</span>
                </div>
                <div className="profile-dropdown-item-static">
                  <span>Dept:</span> <span>{currentUserDetail?.department || "General"}</span>
                </div>
                <div className="profile-dropdown-divider"></div>
                <button 
                  type="button" 
                  className="profile-dropdown-logout-btn" 
                  onClick={() => {
                    localStorage.clear();
                    navigate("/login");
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. THREE COLUMN LAYOUT */}
      <div className={`netmail-layout ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}>
        
        {isSidebarOpen && (
          <div 
            className="netmail-sidebar-backdrop" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside 
          id="netmail-sidebar"
          className={`netmail-sidebar ${isSidebarOpen ? "open" : "collapsed"} ${mobileView === "sidebar" ? "active-mobile" : ""}`}
        >
          <button 
            type="button" 
            className="netmail-compose-btn" 
            onClick={() => {
              handleComposeNew();
              if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
              }
            }}
          >
            <Plus size={16} />
            <span>Compose</span>
          </button>

          <nav className="netmail-menu">
            <div className={`netmail-menu-item ${currentFolder === "inbox" ? "active" : ""}`} onClick={() => { setCurrentFolder("inbox"); setMobileView("list"); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}><Inbox size={16} /> <span>Inbox</span></span>
              {inboxUnreadCount > 0 && <span className="netmail-badge">{inboxUnreadCount}</span>}
            </div>

            <div className={`netmail-menu-item ${currentFolder === "drafts" ? "active" : ""}`} onClick={() => { setCurrentFolder("drafts"); setMobileView("list"); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}><FileText size={16} /> <span>Drafts</span></span>
              {draftsCount > 0 && <span className="netmail-badge">{draftsCount}</span>}
            </div>

            <div className={`netmail-menu-item ${currentFolder === "sent" ? "active" : ""}`} onClick={() => { setCurrentFolder("sent"); setMobileView("list"); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}><Send size={16} /> <span>Sent</span></span>
            </div>

            <div className={`netmail-menu-item ${currentFolder === "deleted" ? "active" : ""}`} onClick={() => { setCurrentFolder("deleted"); setMobileView("list"); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}>
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}><Trash2 size={16} /> <span>Deleted</span></span>
            </div>
          </nav>
        </aside>

        {/* MIDDLE COLUMN: Threads list */}
        <section className={`netmail-list-col ${mobileView === "list" ? "active-mobile" : ""}`}>
          <div className="netmail-list-header">
            <div className="netmail-list-toolbar">
              <button 
                type="button"
                className="netmail-filter-btn md-hidden" 
                onClick={() => setIsSidebarOpen(true)} 
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
                aria-expanded={isSidebarOpen}
                aria-controls="netmail-sidebar"
              >
                <ChevronLeft size={14} /> Menu
              </button>
              <h3 style={{ textTransform: "capitalize" }}>
                {capitalizeFirstLetter(currentFolder)}
                {currentFolder === "inbox" && inboxUnreadCount > 0 ? ` (${inboxUnreadCount})` : ""}
                {currentFolder === "drafts" && draftsCount > 0 ? ` (${draftsCount})` : ""}
              </h3>
              <div style={{ display: "flex", gap: "4px" }}>
                <button type="button" className="netmail-action-btn" onClick={() => fetchFolderList(currentFolder)} title="Refresh folder">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="netmail-inner-search">
              <Search size={14} style={{ opacity: 0.6 }} />
              <input 
                placeholder={`Search in ${currentFolder}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="netmail-filters">
              <button className={`netmail-filter-chip ${activeFilter === "all" ? "active" : ""}`} onClick={() => setActiveFilter("all")}>All</button>
              <button className={`netmail-filter-chip ${activeFilter === "unread" ? "active" : ""}`} onClick={() => setActiveFilter("unread")}>Unread</button>
              <button className={`netmail-filter-chip ${activeFilter === "starred" ? "active" : ""}`} onClick={() => setActiveFilter("starred")}>Starred</button>
            </div>
          </div>

          <div className="netmail-list-scroll">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "60px 40px", alignItems: "center", color: "var(--color-text-muted)" }}>
                <Loader2 className="animate-spin" size={24} color="var(--color-accent)" />
                <span style={{ fontSize: "12px" }}>Synchronizing...</span>
              </div>
            ) : filteredMails.length === 0 ? (
              <div className="netmail-empty-box">
                <FolderOpen size={36} style={{ opacity: 0.2, color: "var(--color-text-muted)" }} />
                <span className="netmail-empty-title">
                  {searchQuery ? "No search results" : `No emails in ${currentFolder}`}
                </span>
                <span className="netmail-empty-sub">
                  {searchQuery 
                    ? `No email matches your query "${searchQuery}"`
                    : `This folder does not contain any messages.`}
                </span>
              </div>
            ) : (
              filteredMails.map((item) => {
                const isRead = item.readBy?.includes(myUserId);
                const isStarred = item.starredBy?.includes(myUserId);
                const hasAttachment = item.attachments && item.attachments.length > 0;

                const displayUser = resolveSenderName(item);
                const initialsSource = resolveInitialsSource(item);

                return (
                  <div 
                    key={item._id} 
                    className={`netmail-row-card ${selectedMailId === item._id ? "selected" : ""} ${(!isRead && currentFolder === "inbox") ? "unread" : ""}`}
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
                    {/* Unread small orange dot to the left of the avatar */}
                    {!isRead && currentFolder === "inbox" && (
                      <span className="netmail-unread-dot"></span>
                    )}

                    <div className="netmail-row-avatar" style={{ backgroundColor: getAvatarBg(initialsSource) }}>
                      {getInitials(initialsSource)}
                    </div>

                    <div className="netmail-row-details">
                      <div className="netmail-row-meta">
                        <span className="netmail-row-sender">{displayUser}</span>
                        <span className="netmail-row-date">{formatMailDate(item.createdAt)}</span>
                      </div>
                      <div className="netmail-row-subject">
                        {currentFolder === "drafts" && <span className="netmail-draft-badge">Draft</span>}
                        <span>{item.subject || "(No Subject)"}</span>
                      </div>
                      <div className="netmail-row-preview">{item.body || "(No message body)"}</div>
                      
                      <div className="netmail-row-indicators">
                        <div>
                          {hasAttachment && <Paperclip size={12} style={{ opacity: 0.5, color: "var(--color-text-muted)" }} />}
                        </div>
                        <Star 
                          size={13} 
                          className={`netmail-star-icon ${isStarred ? "starred" : ""}`} 
                          onClick={(e) => handleToggleStar(e, item._id, isStarred)} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* DETAIL VIEW / COMPOSE WINDOW */}
        <main className={`netmail-detail-col ${mobileView === "detail" ? "active-mobile" : ""}`}>


          {composeMode ? (
            /* COMPOSE / REPLY MODE */
            <div className="netmail-compose">
              <div className="netmail-compose-header">
                {replyToId ? "Reply to Mail" : composeMode === "new" ? "New Mail" : "Edit Draft"}
              </div>

              <form onSubmit={(e) => handleSubmitMail(e, true)} className="netmail-compose-form">
                <div className="netmail-form-row">
                  <label>To</label>
                  {replyToId ? (
                    <div className="netmail-reply-to-recipient">
                      {selectedRecipients.map(r => `${r.fullName || r.name} <${r.email || ""}>`).join(", ")}
                    </div>
                  ) : (
                    <div className="netmail-recipient-picker-wrapper">
                      {selectedRecipients.map((rec) => (
                        <span key={rec._id} className="netmail-recipient-bubble">
                          {rec.fullName || rec.name}
                          <button type="button" onClick={() => setSelectedRecipients(prev => prev.filter(p => p._id !== rec._id))} className="bubble-remove-btn">
                            ×
                          </button>
                        </span>
                      ))}
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
                    </div>
                  )}

                  {!replyToId && showUserDropdown && filteredUserDirectory.length > 0 && (
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
                          <span style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{user.fullName || user.name}</span>
                          <span style={{ color: "var(--color-text-muted)" }}>{user.email} ({user.role} | {user.department || "General"})</span>
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
                    placeholder="Write your email message body..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    maxLength={10000}
                    style={{ height: "100%", minHeight: "180px" }}
                  />
                  {originalMailQuote && (
                    /* Separated quoted reference section */
                    <div className="netmail-compose-quoted">
                      <div className="netmail-quoted-title">Quoted Message</div>
                      <div className="netmail-quoted-meta">
                        On {formatDetailDate(originalMailQuote.createdAt)}, {originalMailQuote.sender?.fullName || originalMailQuote.sender?.name || "System"} wrote:
                      </div>
                      <blockquote className="netmail-quoted-body">
                        {originalMailQuote.body || "(No message body)"}
                      </blockquote>
                    </div>
                  )}
                </div>

                {/* Upload Slot */}
                <div className="netmail-form-row">
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", width: "fit-content" }} className="hover-text-primary">
                    <Paperclip size={14} color="var(--color-accent)" /> 
                    <span style={{ fontWeight: "700" }}>Attach File</span> (Max 10MB)
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
                        <div key={idx} className="netmail-attachment-preview-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", border: "1px solid var(--mail-border)", borderRadius: "6px", background: "var(--mail-surface-soft)" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" }}>
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
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? "Sending..." : "Send Mail"}
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
            /* MESSAGE READER PANEL */
            (() => {
              const showReplyButton = 
                currentFolder === "inbox" && 
                selectedMail.sender && 
                String(selectedMail.sender._id || selectedMail.sender) !== myUserId &&
                selectedMail.status !== "draft" &&
                !selectedMail.deletedBy?.includes(myUserId);

              const senderName = resolveSenderName(selectedMail);
              const senderEmail = selectedMail.sender?.email;
              const initialsSource = resolveInitialsSource(selectedMail);

              return (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                  
                  {/* Toolbar Actions matching reference */}
                  <div className="netmail-detail-toolbar">
                    <div className="netmail-detail-toolbar-left" style={{ display: "flex", gap: "8px" }}>
                      <button 
                        type="button" 
                        className="netmail-action-btn-primary" 
                        onClick={() => {
                          setSelectedMailId(null);
                          setSelectedMail(null);
                          setMobileView("list");
                        }}
                        title="Back to list"
                      >
                        <ArrowLeft size={14} />
                        <span>Back to list</span>
                      </button>

                      {showReplyButton && (
                        <button 
                          type="button" 
                          className="netmail-action-btn-primary" 
                          onClick={() => handleReply(selectedMail)}
                          title="Reply to this mail"
                          aria-label="Reply to this mail"
                        >
                          <CornerUpLeft size={14} />
                          <span>Reply</span>
                        </button>
                      )}

                      <button 
                        type="button"
                        className="netmail-action-btn-primary"
                        onClick={(e) => handleToggleStar(e, selectedMail._id, selectedMail.starredBy?.includes(myUserId))}
                        title="Star"
                      >
                        <Star 
                          size={14} 
                          className={selectedMail.starredBy?.includes(myUserId) ? "starred" : ""}
                          style={{ fill: selectedMail.starredBy?.includes(myUserId) ? "#f4b400" : "none", color: selectedMail.starredBy?.includes(myUserId) ? "#f4b400" : "currentColor" }}
                        />
                        <span>Star</span>
                      </button>

                      {currentFolder === "deleted" ? (
                        <button 
                          type="button" 
                          className="netmail-action-btn-primary" 
                          onClick={() => handleRestoreMail(selectedMail._id)}
                          title="Restore Mail"
                        >
                          <RefreshCw size={14} />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="netmail-action-btn-primary" 
                          onClick={() => handleDeleteMail(selectedMail._id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mail scroll panel details */}
                  <div className="netmail-reader-scroll">
                    <div className="netmail-detail-subject-row">
                      <h2 className="netmail-detail-subject">{selectedMail.subject || "(No Subject)"}</h2>
                      <span className="netmail-folder-badge">{capitalizeFirstLetter(currentFolder)}</span>
                    </div>

                    <div className="netmail-meta-header">
                      <div className="netmail-sender-block">
                        <div className="netmail-sender-avatar" style={{ backgroundColor: getAvatarBg(initialsSource) }}>
                          {getInitials(initialsSource)}
                        </div>
                        <div className="netmail-sender-info">
                          <div className="netmail-sender-name-line">
                            <span style={{ fontWeight: "700", color: "var(--color-text-primary)", fontSize: "14px" }}>{senderName}</span>
                            {senderEmail && <span className="netmail-sender-email">&lt;{senderEmail}&gt;</span>}
                          </div>
                          <div className="netmail-recipient-line">
                            To: {selectedMail.recipients?.map(r => `${r.fullName || r.name || "User"} <${r.email || ""}>`).join(", ")}
                          </div>
                        </div>
                      </div>

                      <div className="netmail-detail-date-col">
                        <span>{formatDetailDate(selectedMail.createdAt)}</span>
                        
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <Star 
                            size={16} 
                            style={{ cursor: "pointer", fill: selectedMail.starredBy?.includes(myUserId) ? "#f4b400" : "none", color: selectedMail.starredBy?.includes(myUserId) ? "#f4b400" : "currentColor" }}
                            onClick={(e) => handleToggleStar(e, selectedMail._id, selectedMail.starredBy?.includes(myUserId))}
                          />
                          {showReplyButton && (
                            <CornerUpLeft 
                              size={16} 
                              style={{ cursor: "pointer" }}
                              onClick={() => handleReply(selectedMail)}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="netmail-body-content">
                      {selectedMail.body || <span style={{ fontStyle: "italic", opacity: 0.4 }}>(No message content body)</span>}
                    </div>

                    {/* Collapsed/Visual Quoted Thread context */}
                    {selectedMail.replyTo && (
                      <div className="netmail-quoted-thread-box">
                        <div className="netmail-quoted-thread-header">
                          --- Quoted Message ---
                        </div>
                        <div className="netmail-quoted-thread-meta">
                          From: {selectedMail.replyTo.sender?.fullName || selectedMail.replyTo.sender?.name || "System Account"}
                        </div>
                        <blockquote className="netmail-quoted-thread-blockquote">
                          {selectedMail.replyTo.body || "(No message body)"}
                        </blockquote>
                      </div>
                    )}

                    {/* Premium Attachments Section */}
                    {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                      <div className="netmail-attachments-container">
                        <div className="netmail-attachments-header">
                          {selectedMail.attachments.length} {selectedMail.attachments.length === 1 ? "Attachment" : "Attachments"}
                        </div>
                        <div className="netmail-attachments-grid">
                          {selectedMail.attachments.map((att) => {
                            const ext = att.originalname?.split(".").pop().toUpperCase() || "FILE";
                            return (
                              <div key={att._id} className="netmail-attachment-tile">
                                <div className="netmail-file-icon" style={{ backgroundColor: getFileIconBg(ext) }}>
                                  {ext}
                                </div>
                                <div className="netmail-attachment-detail">
                                  <span className="netmail-attachment-filename" title={att.originalname}>{att.originalname}</span>
                                  <span className="netmail-attachment-size">{(att.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <div className="netmail-attachment-actions">
                                  <button 
                                    type="button" 
                                    className="netmail-action-btn" 
                                    onClick={() => handleDownloadAttachment(att._id, att.originalname)}
                                    title="Download"
                                    style={{ border: "1px solid var(--mail-border)" }}
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button 
                                    type="button" 
                                    className="netmail-action-btn" 
                                    onClick={() => handleViewAttachment(att._id)}
                                    title="View"
                                    style={{ border: "1px solid var(--mail-border)" }}
                                  >
                                    <Eye size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bottom Quick Reply Trigger Bar */}
                    {showReplyButton && (
                      <div 
                        onClick={() => handleReply(selectedMail)} 
                        className="netmail-quick-reply-trigger"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="netmail-quick-reply-avatar" style={{ backgroundColor: getAvatarBg(myUserName) }}>
                            {getInitials(myUserName)}
                          </div>
                          <span style={{ fontSize: "13px" }}>Click here to Reply or Forward...</span>
                        </div>
                        <CornerUpLeft size={14} style={{ opacity: 0.6 }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : loadingDetail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "100px", alignItems: "center", color: "var(--color-text-muted)" }}>
              <Loader2 className="animate-spin" size={28} color="var(--color-accent)" />
              <span style={{ fontSize: "12px" }}>Opening thread...</span>
            </div>
          ) : (
            /* NO SELECTED MAIL DEFAULT PANELS */
            <div className="netmail-empty-box">
              <div style={{ 
                width: "60px", 
                height: "60px", 
                borderRadius: "50%", 
                backgroundColor: "var(--mail-surface-soft)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                marginBottom: "8px",
                border: "1px solid var(--mail-border)"
              }}>
                <Mail size={24} style={{ opacity: 0.3, color: "var(--color-text-secondary)" }} />
              </div>
              <span className="netmail-empty-title">Select an email to read</span>
              <span className="netmail-empty-sub">Choose a conversation from the folder list to see detailed messages.</span>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
