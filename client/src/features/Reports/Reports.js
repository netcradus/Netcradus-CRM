import React from "react";
import Sidebar from "../../components/Dashboard/Sidebar";
import "./Reports.css";

function Reports() {
  return (
    <div className="dashboard-container">
  

      <main className="dashboard">
        <h2>📊 Reports</h2>
        <p>Generate and view detailed reports on sales, support, and more.</p>

        <div className="report-box">
          <h4>Coming Soon:</h4>
          <ul>
            <li>Sales by region</li>
            <li>Support response time</li>
            <li>Customer engagement</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default Reports;