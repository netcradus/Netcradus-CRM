import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { partnerApi } from "./partnerApi";

export default function PartnerNotifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Partners reuse the existing bell notification API but render it in the partner panel.
    partnerApi.notifications().then((res) => setItems(res.data.data || [])).catch(() => setItems([]));
  }, []);

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Notifications</h1>
          <p className="subtitle">Project updates, files, invoices and internal comments shared with you.</p>
        </div>
      </div>
      <div className="nc-card" style={{ padding: "var(--space-5)" }}>
        {items.map((item) => (
          <div key={item._id} style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-4) 0", borderTop: "1px solid var(--color-border)" }}>
            <Bell size={18} color="var(--color-accent)" />
            <div>
              <div>{item.message}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{new Date(item.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {!items.length && <p className="subtitle">No notifications yet.</p>}
      </div>
    </div>
  );
}
