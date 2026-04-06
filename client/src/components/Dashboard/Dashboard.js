import React from "react";
import AdminDashboard from "./AdminDashboard";
import SalesDashboard from "./SalesDashboard";
import SupportDashboard from "./SupportDashboard";
import HRDashboard from "./HRDashboard";
import TechDashboard from "./TechDashboard";
import DigitalMediaDashboard from "./DigitalMediaDashboard";
import "./Dashboard.css";

function Dashboard() {
  const userRole = localStorage.getItem("userRole");

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
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
            <p>Unknown role. Please contact admin.</p>
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
