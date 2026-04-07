import React from "react";
import SuperUserDashboard from "./SuperUserDashboard";
import ManagementDashboard from "./ManagementDashboard";
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
