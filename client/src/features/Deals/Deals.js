import React, { useEffect, useState } from "react";
import axios from "axios";
import { Handshake, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const API = apiUrl("/api/deals");

function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", status: "New", value: "", assignedTo: "" });

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setDeals(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/${editingId}`, form);
    } else {
      await axios.post(API, form);
    }
    fetchDeals();
    setShowModal(false);
    setForm({ name: "", status: "New", value: "", assignedTo: "" });
    setEditingId(null);
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Deals Room</h1>
          <p className="subtitle">Manage sales pipeline, deal values and status.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ name: "", status: "New", value: "", assignedTo: "" }); setShowModal(true); }}>
            <Plus size={16} /> New Deal
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Pipeline Value</span>
          <span className="metric-value">₹ {deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Deals</span>
          <span className="metric-value">{deals.filter(d => d.status !== 'Lost').length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Won Deals</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{deals.filter(d => d.status === 'Won').length}</span>
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Status</th>
              <th>Value</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading deals...</td></tr>
            ) : deals.map(d => (
              <tr key={d._id}>
                <td><div style={{ fontWeight: 'var(--font-semibold)' }}>{d.name}</div></td>
                <td>
                   <span className={`badge badge-${d.status === 'Won' ? 'success' : d.status === 'Lost' ? 'error' : 'warning'}`}>
                    {d.status}
                   </span>
                </td>
                <td style={{ fontWeight: 'var(--font-bold)' }}>₹ {Number(d.value).toLocaleString('en-IN')}</td>
                <td>{d.assignedTo || "Unassigned"}</td>
                <td>
                   <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost" onClick={() => {
                        setEditingId(d._id);
                        setForm({ name: d.name, status: d.status, value: d.value, assignedTo: d.assignedTo || "" });
                        setShowModal(true);
                      }}><Pencil size={14} /></button>
                      <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={async () => {
                        if(window.confirm("Delete deal?")) {
                          await axios.delete(`${API}/${d._id}`);
                          fetchDeals();
                        }
                      }}><Trash2 size={14} /></button>
                   </div>
                </td>
              </tr>
            ))}
            {deals.length === 0 && !loading && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>No deals found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Deal" : "Add Deal"}</h3></div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-field">
                <label className="form-label">Deal Name</label>
                <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-field">
                <label className="form-label">Deal Value (₹)</label>
                <input className="form-input" type="number" required value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
              </div>
              <div className="form-field">
                <label className="form-label">Assigned To</label>
                <input className="form-input" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option>New</option><option>In Progress</option><option>Won</option><option>Lost</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Deal</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deals;