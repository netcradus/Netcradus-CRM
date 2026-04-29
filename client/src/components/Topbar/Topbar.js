import React from "react";
import { Search } from "lucide-react";
import NotificationButton from "../NotificationButton";
import ThemeToggle from "../ThemeToggle";
import "./Topbar.css";

const Topbar = () => {
  const userName = localStorage.getItem("userName") || "User";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo-mark">
          <span className="topbar-orbit" />
          <span className="topbar-orbit-inner" />
        </div>
        <div className="topbar-title">
          <div className="topbar-product-logo-wrap">
            <img src="/netcradus.png" alt="Netcradus" className="topbar-product-logo" />
          </div>
          <span className="topbar-subtitle">Revenue CRM Workspace</span>
        </div>
      </div>

      <div className="topbar-right">
        <ThemeToggle className="topbar-theme-toggle" compact />

        <div className="topbar-search">
          <Search size={16} />
          <input
            placeholder="Search leads, accounts, deals..."
            aria-label="Global search"
          />
        </div>

        <NotificationButton />

        <div className="topbar-avatar" title={userName}>
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
