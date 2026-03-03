import React from "react";
import { FaHeadset } from "react-icons/fa";
import "./SupportDashboard.css";

function SupportDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard">
        <h2><FaHeadset />Support Agent</h2>

        {/* Actions */}
        <div className="dashboard-actions">
          <div className="actions-left">
            <input type="text" placeholder="Search tickets..." />
            <select>
              <option>All</option>
              <option>Open</option>
              <option>Resolved</option>
              <option>Pending</option>
            </select>
          </div>

          <div className="actions-right">
            <button className="btn primary">Raise Ticket</button>
            <button className="btn success">Export</button>
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

        {/* Bottom Section */}
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