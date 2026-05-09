import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, ChevronRight, Edit, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyCase = { caseId: "", title: "", assignedTo: "", status: "Open" };

function Cases() {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyCase);
  const [editingId, setEditingId] = useState(null);

  const fetchCases = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/cases"));
      setCases(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filteredCases = useMemo(() => {
    const needle = search.toLowerCase();
    return cases.filter((item) => `${item.caseId} ${item.title} ${item.assignedTo}`.toLowerCase().includes(needle));
  }, [cases, search]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      caseId: form.caseId || `C-${Date.now().toString().slice(-6)}`,
    };

    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/cases/${editingId}`), payload);
      } else {
        await axios.post(apiUrl("/api/cases"), payload);
      }
      setForm(emptyCase);
      setEditingId(null);
      setIsModalOpen(false);
      fetchCases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this case?")) return;
    try {
      await axios.delete(apiUrl(`/api/cases/${id}`));
      fetchCases();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Support</span><ChevronRight size={10} /><span>Cases</span>
          </div>
          <h1 className="title">Support Cases</h1>
          <p className="subtitle">Track customer issues, technical bugs, and case ownership from the live support queue.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyCase); setIsModalOpen(true); }}><Plus size={16} /> Create Case</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ position: "relative", maxWidth: "320px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: "36px" }} placeholder="Search case ID or title..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>Case ID</th><th>Title</th><th>Assigned To</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredCases.map((item) => (
              <tr key={item._id}>
                <td><span style={{ fontWeight: "var(--font-bold)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{item.caseId}</span></td>
                <td style={{ fontWeight: "var(--font-semibold)" }}>{item.title}</td>
                <td>{item.assignedTo}</td>
                <td><span className={`badge badge-${item.status === "Resolved" ? "success" : item.status === "Open" ? "error" : "warning"}`}>{item.status}</span></td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }} onClick={() => { setEditingId(item._id); setForm({ caseId: item.caseId || "", title: item.title || "", assignedTo: item.assignedTo || "", status: item.status || "Open" }); setIsModalOpen(true); }}><Edit size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-error)" }} onClick={() => handleDelete(item._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCases.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No cases found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="nc-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "420px" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Case" : "New Case"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Case ID</label>
                <input className="form-input" placeholder="Auto-generated if left blank" value={form.caseId} onChange={(event) => setForm({ ...form, caseId: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Case Title</label>
                <input className="form-input" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Assigned To</label>
                <input className="form-input" required value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Case</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cases;
