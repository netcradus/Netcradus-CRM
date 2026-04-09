import React from "react";
import SuperUserDashboard from "./SuperUserDashboard.js";
import ManagementDashboard from "./ManagementDashboard.js";
import AdminDashboard from "./AdminDashboard.js";
import SalesDashboard from "./SalesDashboard.js";
import SupportDashboard from "./SupportDashboard.js";
import HRDashboard from "./HRDashboard.js";
import TechDashboard from "./TechDashboard.js";
import DigitalMediaDashboard from "./DigitalMediaDashboard.js";
import "./Dashboard.css";

function Dashboard() {
  const userRole = localStorage.getItem("userRole");

  const renderDashboard = () => {
    switch (userRole) {
      case "super_user":
        return <SuperUserDashboard />;
      case "admin":
        return <AdminDashboard />;
      case "management":
        return <ManagementDashboard />;
      case "sales":
        return <SalesDashboard />;
      case "support":
        return <SupportDashboard />;
      case "hr":
        return <HRDashboard />;
      case "it":
        return <TechDashboard />;
      case "digital_media":
        return <DigitalMediaDashboard />;
      default:
        return (
          <div className="role-fallback">
            <p>Welcome to Netcradus CRM. Your dashboard is being configured.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <main className="dashboard-content">{renderDashboard()}</main>
      </div>
    </div>
  );
}

export default Dashboard;
