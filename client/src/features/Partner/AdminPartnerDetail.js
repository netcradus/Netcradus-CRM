import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { partnerApi, StatusBadge } from "./partnerApi";

export default function AdminPartnerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Admin detail reuses partner-scoped tables but keeps them visible in one read-focused view.
    partnerApi.adminPartner(id).then((res) => setData(res.data)).catch(() => setData(null));
  }, [id]);

  if (!data) return <div className="nc-page"><div className="nc-loading">Loading partner...</div></div>;

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <Link to="/admin/partners" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Back to partners</Link>
      <div className="page-header" style={{ marginTop: "var(--space-4)" }}>
        <div className="page-header-left">
          <h1 className="title">{data.partner.name}</h1>
          <p className="subtitle">{data.partner.email}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="nc-stat-card"><span className="metric-label">Revenue Generated</span><span className="metric-value">{data.revenueSummary?.revenueGenerated || 0}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Commission</span><span className="metric-value">{data.revenueSummary?.commission || 0}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Vendors</span><span className="metric-value">{data.vendors?.length || 0}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Projects</span><span className="metric-value">{data.projects?.length || 0}</span></div>
      </div>

      <section className="nc-card" style={{ marginBottom: "var(--space-6)" }}>
        <table className="nc-table">
          <thead><tr><th>Vendor Name</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>Country</th><th>Status</th></tr></thead>
          <tbody>{(data.vendors || []).map((vendor) => <tr key={vendor._id}><td>{vendor.name}</td><td>{vendor.contactPerson}</td><td>{vendor.email}</td><td>{vendor.phone}</td><td>{vendor.country}</td><td>{vendor.status}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="nc-card" style={{ marginBottom: "var(--space-6)" }}>
        <table className="nc-table">
          <thead><tr><th>Project</th><th>Vendor</th><th>Service</th><th>Status</th><th>Priority</th><th>Deadline</th></tr></thead>
          <tbody>{(data.projects || []).map((project) => <tr key={project._id}><td>{project.name}</td><td>{project.vendorId?.name || "-"}</td><td>{project.serviceType || "-"}</td><td><StatusBadge status={project.status} /></td><td>{project.priority}</td><td>{project.deadline ? new Date(project.deadline).toLocaleDateString("en-GB") : "-"}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="nc-card" style={{ padding: "var(--space-5)" }}>
        <h3 style={{ marginTop: 0 }}>Activity Log</h3>
        {!data.activityLog?.length && <p className="subtitle">No activity log entries yet.</p>}
      </section>
    </div>
  );
}
