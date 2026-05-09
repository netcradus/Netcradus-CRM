import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, ChevronRight, Edit, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptySolution = { title: "", client: "", date: "", status: "Pending", notes: "" };

function Solutions() {
  const [solutions, setSolutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptySolution);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  const fetchSolutions = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl(`/api/solutions${filter !== "All" ? `?status=${encodeURIComponent(filter)}` : ""}`));
      setSolutions(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load solutions.");
      setSolutions([]);
    }
  }, [filter]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  const counts = useMemo(() => ({
    Delivered: solutions.filter((item) => item.status === "Delivered").length,
    "In Progress": solutions.filter((item) => item.status === "In Progress").length,
    Pending: solutions.filter((item) => item.status === "Pending").length,
  }), [solutions]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/solutions/${editingId}`), form);
      } else {
        await axios.post(apiUrl("/api/solutions"), form);
      }
      setForm(emptySolution);
      setEditingId(null);
      setShowModal(false);
      fetchSolutions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save solution.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this solution?")) return;
    try {
      await axios.delete(apiUrl(`/api/solutions/${id}`));
      fetchSolutions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete solution.");
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Delivery</span><ChevronRight size={10} /><span>Solutions</span>
          </div>
          <h1 className="title">Client Solutions</h1>
          <p className="subtitle">Catalogue of delivered and ongoing business solutions for clients.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptySolution); setShowModal(true); }}><Plus size={16} /> New Solution</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("All")}><span className="metric-label">Total Solutions</span><span className="metric-value">{solutions.length}</span></div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("Delivered")}><span className="metric-label">Delivered</span><span className="metric-value" style={{ color: "var(--color-success)" }}>{counts.Delivered}</span></div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("In Progress")}><span className="metric-label">In Progress</span><span className="metric-value" style={{ color: "var(--color-warning)" }}>{counts["In Progress"]}</span></div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("Pending")}><span className="metric-label">Pending</span><span className="metric-value" style={{ color: "var(--color-info)" }}>{counts.Pending}</span></div>
      </div>

      {error && <div className="portfolio-error" style={{ marginBottom: "var(--space-4)" }}>{error}</div>}

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>Title</th><th>Client</th><th>Date</th><th>Status</th><th>Notes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {solutions.map((solution) => (
              <tr key={solution._id}>
                <td style={{ fontWeight: "var(--font-semibold)" }}>{solution.title}</td>
                <td><span className="badge badge-neutral">{solution.client}</span></td>
                <td>{solution.date ? new Date(solution.date).toLocaleDateString("en-GB") : "—"}</td>
                <td><span className={`badge badge-${solution.status === "Delivered" ? "success" : solution.status === "Pending" ? "info" : "warning"}`}>{solution.status}</span></td>
                <td style={{ maxWidth: "240px", whiteSpace: "normal" }}>{solution.notes || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }} onClick={() => { setEditingId(solution._id); setForm({ title: solution.title || "", client: solution.client || "", date: solution.date?.substring(0, 10) || "", status: solution.status || "Pending", notes: solution.notes || "" }); setShowModal(true); }}><Edit size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-error)" }} onClick={() => handleDelete(solution._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {solutions.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No solutions found for this category.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "450px" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Solution" : "Add New Solution"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Solution Title</label>
                <input className="form-input" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Client Name</label>
                <input className="form-input" required value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Current Status</label>
                  <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Internal Notes</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Solution</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Solutions;
