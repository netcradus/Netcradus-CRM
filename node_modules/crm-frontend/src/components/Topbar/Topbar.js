import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PanelLeft, Search, Globe } from "lucide-react";
import NotificationButton from "../NotificationButton";
import ThemeToggle from "../ThemeToggle";
import { internalMailApi } from "../../features/Mail/internalMailApi";
import { getAppSocket } from "../../services/socket";
import GoogleSearchModal from "./GoogleSearchModal";

const notificationsEnabled = String(process.env.REACT_APP_NOTIFICATIONS_ENABLED || "true").toLowerCase() === "true";

const Topbar = ({ onToggleSidebar, isSidebarExpanded }) => {
  const userName = localStorage.getItem("userName") || "User";
  const initials = userName.slice(0, 2).toUpperCase();
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const [unreadCount, setUnreadCount] = useState(0);
  const [isGoogleSearchOpen, setIsGoogleSearchOpen] = useState(false);

  useEffect(() => {
    const fetchUnreadCount = () => {
      internalMailApi.getUnreadCount()
        .then(res => {
          setUnreadCount(res.data?.data?.unreadCount || 0);
        })
        .catch(err => console.error("Failed to load unread count:", err));
    };

    fetchUnreadCount();

    const token = localStorage.getItem("token");
    const socket = getAppSocket(token);
    if (socket) {
      const handleNewMail = () => {
        fetchUnreadCount();
      };
      socket.on("new_mail", handleNewMail);
      return () => {
        socket.off("new_mail", handleNewMail);
      };
    }
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        {isMobile && (
          <button
            type="button"
            className={`topbar-menu-btn ${isSidebarExpanded ? "is-active" : ""}`}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}
        <div className="topbar-logo-mark">
          {initials}
        </div>
        <div className="topbar-title">
          <div className="topbar-product-logo-wrap">
            <img src="/netcradus.png" alt="Netcradus" className="topbar-product-logo" />
          </div>
          <span className="topbar-subtitle">Revenue CRM Workspace</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={14} />
          <input
            placeholder="Search leads, accounts, deals..."
            aria-label="Global search"
            onChange={(e) => {
              window.dispatchEvent(new CustomEvent("global-search", {
                detail: { query: e.target.value }
              }));
            }}
          />
        </div>

        <button 
          type="button"
          className="topbar-browser-btn" 
          title="Open Google Search"
          aria-label="Open Google Search"
          onClick={() => setIsGoogleSearchOpen(true)}
          style={{ 
            background: "none",
            border: "none",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "36px", 
            height: "36px", 
            borderRadius: "50%", 
            color: "var(--color-text-secondary)", 
            transition: "background-color 0.2s",
            cursor: "pointer",
            padding: 0
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--color-bg-hover)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <Globe size={18} />
        </button>

        <ThemeToggle className="topbar-theme-toggle" compact />
        
        {/* Mail entry button */}
        <Link 
          to="/dashboard/mail" 
          className="topbar-mail-btn" 
          title="Open Internal Mail"
          aria-label="Open Internal Mail"
          style={{ 
            position: "relative", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "36px", 
            height: "36px", 
            borderRadius: "50%", 
            color: "var(--color-text-secondary)", 
            transition: "background-color 0.2s",
            cursor: "pointer"
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--color-bg-hover)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <img src="/mailicon.png" alt="Mail" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
          {unreadCount > 0 && (
            <span style={{ 
              position: "absolute", 
              top: "-2px", 
              right: "-2px", 
              backgroundColor: "var(--color-accent)", 
              color: "#fff", 
              fontSize: "10px", 
              fontWeight: "bold", 
              borderRadius: "50%", 
              minWidth: "16px", 
              height: "16px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "0 4px" 
            }}>
              {unreadCount}
            </span>
          )}
        </Link>

        {notificationsEnabled ? <NotificationButton /> : null}

        <div className="topbar-avatar" title={userName}>
          {initials}
        </div>
      </div>

      <GoogleSearchModal 
        isOpen={isGoogleSearchOpen} 
        onClose={() => setIsGoogleSearchOpen(false)} 
      />
    </header>
  );
};

export default Topbar;
