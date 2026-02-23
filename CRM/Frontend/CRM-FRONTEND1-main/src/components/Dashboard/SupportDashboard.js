import React from "react";
import { FaHeadset } from "react-icons/fa";
import Sidebar from "./Sidebar";
import "./SupportDashboard.css";

function SupportDashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard">
        <h2><FaHeadset /> Welcome, Support Agent 🎧</h2>

        {/* Action buttons and filters */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Search tickets..."
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #555",
                backgroundColor: "#1c1c1c",
                color: "#fff"
              }}
            />
            <select
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #555",
                backgroundColor: "#1c1c1c",
                color: "#fff"
              }}
            >
              <option>All</option>
              <option>Open</option>
              <option>Resolved</option>
              <option>Pending</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer"
            }}>
              Raise Ticket
            </button>
            <button style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#28a745",
              color: "#fff",
              cursor: "pointer"
            }}>
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="top-cards">
          <div className="card">
            <p>Open Tickets</p>
            <strong>42</strong>
          </div>
          <div className="card">
            <p>Resolved Today</p>
            <strong>15</strong>
          </div>
          <div className="card">
            <p>Avg. Response Time</p>
            <strong>4 min</strong>
          </div>
        </div>

        {/* Lists Section */}
        <div className="bottom-section">
          <div className="card">
            <p><strong>Recent Issues</strong></p>
            <ul>
              <li>Password reset - Olivia</li>
              <li>Login issue - James</li>
              <li>Account suspended - Emma</li>
            </ul>
          </div>
          <div className="card">
            <p><strong>Pending Follow-ups</strong></p>
            <ul>
              <li>#1056 - awaiting reply</li>
              <li>#1071 - check status</li>
              <li>#1090 - pending update</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportDashboard;
