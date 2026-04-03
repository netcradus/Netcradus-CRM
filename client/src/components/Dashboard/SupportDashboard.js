import React from "react";
import { Headset, Search, Plus, Download } from "lucide-react";
import "./SupportDashboard.css";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";


function SupportDashboard({ preview }) {
  return (
    <div className="nc-page support-page">
       {!preview && (
        <div className="nc-hero">
          <div>
            <div className="nc-badge">
              <Headset size={14} />
              <span>Netcradus Support Desk</span>
            </div>
            <h1 className="nc-hero-title">
              Support <span className="nc-gradient-text">Command Center</span>
            </h1>
            <p className="nc-hero-subtitle">
              Triage tickets, monitor response time, and resolve issues.
            </p>
          </div>

          <div className="nc-hero-actions">
            <span className="nc-pill">
              <span className="support-live-dot" />
              System Active
            </span>
            <div style={{ marginTop: '12px' }}>
              <AttendanceWidget />
            </div>
          </div>
        </div>
      )}

      <div className="nc-panel nc-section">
        <div className="nc-controls">
          <div className="nc-controls-left">
            <div className="support-search">
              <Search size={16} />
              <input className="nc-input support-search-input" placeholder="Search tickets..." />
            </div>
            <select className="nc-select">
              <option>All</option>
              <option>Open</option>
              <option>Resolved</option>
              <option>Pending</option>
            </select>
          </div>

          <div className="nc-controls-right">
            <button className="nc-btn nc-btn--primary">
              <Plus size={16} />
              Raise Ticket
            </button>
            <button className="nc-btn">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="support-spacer" />

      <div className="nc-grid">
        <div className="nc-card">
          <div className="nc-card-title">Open Tickets</div>
          <div className="nc-card-value">42</div>
        </div>
        <div className="nc-card">
          <div className="nc-card-title">Resolved Today</div>
          <div className="nc-card-value">15</div>
        </div>
        <div className="nc-card">
          <div className="nc-card-title">Avg. Response Time</div>
          <div className="nc-card-value">4 min</div>
        </div>
      </div>

      <div className="support-spacer" />

      <div className="support-bottom">
        <div className="nc-card">
          <div className="support-card-header">
            <h3>Recent Issues</h3>
            <span className="nc-status nc-status--pending">Hot</span>
          </div>
          <ul className="support-list">
            <li>Password reset — Olivia</li>
            <li>Login issue — James</li>
            <li>Account suspended — Emma</li>
          </ul>
        </div>

        <div className="nc-card">
          <div className="support-card-header">
            <h3>Pending Follow-ups</h3>
            <span className="nc-status nc-status--ok">Tracked</span>
          </div>
          <ul className="support-list">
            <li>#1056 — awaiting reply</li>
            <li>#1071 — check status</li>
            <li>#1090 — pending update</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SupportDashboard;