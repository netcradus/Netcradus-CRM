import React from "react";
import Sidebar from "./Dashboard/Sidebar"; // Adjust if your Sidebar is in another path
import "./Reports.css"; // Optional, only if you create the CSS

function Reports() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard">
        <h2>📊 Reports</h2>
        <p>Generate and view detailed reports on sales, support, and more.</p>

        {/* Placeholder for future charts or filters */}
        <div className="report-box">
          <h4>Coming Soon:</h4>
          <ul>
            <li>Sales by region</li>
            <li>Support response time</li>
            <li>Customer engagement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Reports;
