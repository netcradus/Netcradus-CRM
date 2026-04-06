import React from "react";
import { Search } from "lucide-react";
import NotificationButton from "../NotificationButton";
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
          <span className="topbar-product">Netcradus</span>
          <span className="topbar-subtitle">Revenue CRM Workspace</span>
        </div>
      </div>

      <div className="topbar-right">
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
