import React from "react";
import { Database } from "lucide-react";

const StorageAdminPage = () => (
  <div
    className="dashboard-container"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-6)",
    }}
  >
    <div className="empty-state">
      <Database size={48} className="icon" />
      <h3>Storage Under Maintenance</h3>
      <p>Drive administration is temporarily unavailable while maintenance is in progress.</p>
    </div>
  </div>
);

export default StorageAdminPage;
