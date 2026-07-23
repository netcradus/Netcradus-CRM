import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { partnerApi, StatusBadge } from "./partnerApi";

const emptyProject = { name: "", vendorId: "", serviceType: "", description: "", priority: "Medium", expectedBudget: "", startDate: "", deadline: "", notes: "" };
const serviceTypes = ["Penetration Testing", "SOC Monitoring", "Web Development", "Cloud Security", "SIEM Deployment", "Compliance", "Incident Response"];

export default function PartnerProjects() {
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyProject);

  const load = () => {
    // Partner project and vendor APIs enforce ownership on the server.
    partnerApi.projects().then((res) => setProjects(res.data.projects || [])).catch(() => setProjects([]));
    partnerApi.vendors().then((res) => setVendors(res.data.vendors || [])).catch(() => setVendors([]));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return projects.filter((project) => `${project.name} ${project.clientCompany} ${project.serviceType} ${project.status}`.toLowerCase().includes(needle));
  }, [projects, search]);

  const submit = async (event) => {
    event.preventDefault();
    await partnerApi.createProject(form);
    setForm(emptyProject);
    setShowModal(false);
    load();
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">My Projects</h1>
          <p className="subtitle">Projects submitted by your partner account.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add New Project</button>
        </div>
      </div>

      <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div style={{ position: "relative", maxWidth: 340 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search projects..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead><tr><th>Project Name</th><th>Client/Vendor</th><th>Service Type</th><th>Status</th><th>Priority</th><th>Deadline</th><th>Last Updated</th></tr></thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project._id} onClick={() => window.location.href = `/partner/projects/${project._id}`} style={{ cursor: "pointer" }}>
                <td><Link to={`/partner/projects/${project._id}`}>{project.name}</Link></td>
                <td>{project.vendorId?.name || project.clientCompany || "-"}</td>
                <td>{project.serviceType || "-"}</td>
                <td><StatusBadge status={project.status} /></td>
                <td>{project.priority || "-"}</td>
                <td>{project.deadline ? new Date(project.deadline).toLocaleDateString("en-GB") : "-"}</td>
                <td>{project.updatedAt ? new Date(project.updatedAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No projects found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "min(760px, 94vw)" }}>
            <div className="nc-modal-header"><h3>Add New Project</h3></div>
            <form className="form" onSubmit={submit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                <label className="form-field"><span className="form-label">Project Name</span><input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">Select Vendor/Client</span><select className="form-select" required value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}><option value="">Select vendor</option>{vendors.map((vendor) => <option key={vendor._id} value={vendor._id}>{vendor.name}</option>)}</select></label>
                <label className="form-field"><span className="form-label">Service Type</span><select className="form-select" required value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}><option value="">Select service</option>{serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                <label className="form-field"><span className="form-label">Priority Level</span><select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["Low", "Medium", "High", "Critical"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
                <label className="form-field"><span className="form-label">Expected Budget</span><input className="form-input" type="number" value={form.expectedBudget} onChange={(e) => setForm({ ...form, expectedBudget: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">Start Date</span><input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">Deadline</span><input className="form-input" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">File Upload</span><input className="form-input" type="file" disabled title="Drive upload can be attached from project detail once enabled." /></label>
              </div>
              <label className="form-field"><span className="form-label">Project Description</span><textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <label className="form-field"><span className="form-label">Notes</span><textarea className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
                <button className="btn btn-primary" type="submit">Save Project</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
