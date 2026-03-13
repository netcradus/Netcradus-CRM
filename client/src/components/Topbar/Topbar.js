import React from "react";
import { Search, User } from "lucide-react";
import "./Topbar.css";

const Topbar = () => {
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

        <div className="topbar-avatar">
          <User size={18} />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
