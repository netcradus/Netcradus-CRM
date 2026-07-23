import React from "react";
import { Cloud } from "lucide-react";

const Documents = () => (
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
      <Cloud size={48} className="icon" />
      <h3>Drive Temporarily Unavailable</h3>
      <p>Cloud Drive is currently under maintenance. Please try again later.</p>
    </div>
  </div>
);

export default Documents;
