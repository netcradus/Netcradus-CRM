import React from "react";
import "./Topbar.css";

const Topbar = () => {
  return (
    <div className="topbar">
      <h2>Netcradus CRM</h2>
      <div className="topbar-right">
        <span>🔔</span>
        <span>👤</span>
      </div>
    </div>
  );
};

export default Topbar;
