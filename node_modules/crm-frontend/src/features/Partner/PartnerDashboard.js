import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Briefcase, CheckCircle2, Clock, FolderKanban, IndianRupee, Ticket, Truck } from "lucide-react";
import { partnerApi } from "./partnerApi";

function StatCard({ label, value, icon }) {
  return (
    <div className="nc-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <span className="metric-label">{label}</span>
        <span style={{ color: "var(--color-accent)" }}>{icon}</span>
      </div>
      <span className="metric-value">{value}</span>
    </div>
  );
}

export default function PartnerDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Partner dashboard reads only partner-scoped aggregate data from the backend.
    partnerApi.dashboard().then((res) => setData(res.data.data)).catch(() => setData({}));
  }, []);

  const stats = data || {};

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Partner Dashboard</h1>
          <p className="subtitle">Vendor and project activity linked to your partner account.</p>
        </div>
        <div className="page-header-right">
          <Link className="btn btn-primary" to="/partner/projects">My Projects</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <StatCard label="Total Vendors" value={stats.totalVendors || 0} icon={<Truck size={18} />} />
        <StatCard label="Active Projects" value={stats.activeProjects || 0} icon={<FolderKanban size={18} />} />
        <StatCard label="Pending Projects" value={stats.pendingProjects || 0} icon={<Clock size={18} />} />
        <StatCard label="Completed Projects" value={stats.completedProjects || 0} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Revenue Generated" value={stats.revenueGenerated || 0} icon={<IndianRupee size={18} />} />
        <StatCard label="Open Tickets" value={stats.openTickets || 0} icon={<Ticket size={18} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-6)" }}>
        <section className="nc-card" style={{ padding: "var(--space-5)" }}>
          <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}><Bell size={18} /> Latest Notifications</h3>
          {(stats.latestNotifications || []).slice(0, 5).map((item) => (
            <div key={item._id} style={{ padding: "var(--space-3) 0", borderTop: "1px solid var(--color-border)" }}>{item.message}</div>
          ))}
          {!stats.latestNotifications?.length && <p className="subtitle">No notifications yet.</p>}
        </section>

        <section className="nc-card" style={{ padding: "var(--space-5)" }}>
          <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}><Briefcase size={18} /> Recent Project Updates</h3>
          {(stats.recentProjectUpdates || []).slice(0, 5).map((item) => (
            <div key={item._id} style={{ padding: "var(--space-3) 0", borderTop: "1px solid var(--color-border)" }}>
              <strong>{item.eventText}</strong>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{new Date(item.createdAt).toLocaleString()}</div>
            </div>
          ))}
          {!stats.recentProjectUpdates?.length && <p className="subtitle">No activity recorded yet.</p>}
        </section>
      </div>
    </div>
  );
}
