import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO, isAfter } from "date-fns";
import "./Attendance.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const userRole  = localStorage.getItem("userRole");
const isAdmin   = userRole === "admin";

const TYPE_BADGE = {
  national:   { label: "National",   cls: "badge-present" },
  restricted: { label: "Restricted", cls: "badge-half" },
  company:    { label: "Company",    cls: "badge-holiday" },
};

const EMPTY_FORM = { name: "", date: "", type: "national", description: "" };

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState("all");     // all | upcoming | past

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/holidays`, { headers: getHeaders() });
      setHolidays(data.data || []);
    } catch(e) {
      setError("Failed to load holidays.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (h) => {
    setForm({ name: h.name, date: h.date?.substring(0, 10), type: h.type, description: h.description || "" });
    setEditId(h._id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      if (editId) {
        await axios.patch(`${API}/holidays/${editId}`, form, { headers: getHeaders() });
        setSuccess("✅ Holiday updated.");
      } else {
        await axios.post(`${API}/holidays`, form, { headers: getHeaders() });
        setSuccess("✅ Holiday added.");
      }
      setShowForm(false);
      fetchHolidays();
    } catch(e) {
      setError(e.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    setError(""); setSuccess("");
    try {
      await axios.delete(`${API}/holidays/${id}`, { headers: getHeaders() });
      setSuccess("✅ Holiday deleted.");
      fetchHolidays();
    } catch(e) {
      setError(e.response?.data?.message || "Delete failed.");
    }
  };

  const now = new Date();
  const filtered = holidays.filter(h => {
    const d = h.date ? parseISO(h.date) : null;
    if (filter === "upcoming") return d && isAfter(d, now);
    if (filter === "past")     return d && !isAfter(d, now);
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="att-page">
      {/* Header */}
      <div className="att-header">
        <div>
          <h1 className="att-title">Holiday Calendar</h1>
          <p className="att-subtitle">Company & national holidays for {now.getFullYear()}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>+ Add Holiday</button>
        )}
      </div>

      {error   && <div className="att-alert att-alert-error">{error}</div>}
      {success && <div className="att-alert att-alert-success">{success}</div>}

      {/* Filter */}
      <div className="att-tabs">
        {["all", "upcoming", "past"].map(f => (
          <button key={f} className={`att-tab ${filter === f ? "att-tab-active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Holiday List */}
      <div className="att-section">
        {loading ? (
          <div className="att-loading">Loading holidays…</div>
        ) : filtered.length === 0 ? (
          <div className="att-empty">No holidays found for this filter.</div>
        ) : (
          <div className="holiday-grid">
            {filtered.map(h => {
              const d = h.date ? parseISO(h.date) : null;
              const upcoming = d && isAfter(d, now);
              return (
                <div key={h._id} className={`holiday-card ${upcoming ? "holiday-upcoming" : "holiday-past"}`}>
                  <div className="holiday-date">
                    {d ? (
                      <>
                        <span className="holiday-day">{format(d, "dd")}</span>
                        <span className="holiday-month">{format(d, "MMM")}</span>
                      </>
                    ) : "—"}
                  </div>
                  <div className="holiday-info">
                    <div className="holiday-name">{h.name}</div>
                    <div className="holiday-weekday">{d ? format(d, "EEEE") : ""}</div>
                    <span className={`badge ${TYPE_BADGE[h.type]?.cls || "badge-weekend"}`}>
                      {TYPE_BADGE[h.type]?.label || h.type}
                    </span>
                    {h.description && <div className="holiday-desc">{h.description}</div>}
                  </div>
                  {isAdmin && (
                    <div className="holiday-actions">
                      <button className="btn-icon" onClick={() => openEdit(h)} title="Edit">✏️</button>
                      <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(h._id)} title="Delete">🗑️</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="att-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <h3>{editId ? "Edit Holiday" : "Add Holiday"}</h3>
              <button onClick={() => setShowForm(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleSave} className="att-form">
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input type="text" required placeholder="e.g. Diwali" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date <span className="required">*</span></label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="national">National</option>
                    <option value="restricted">Restricted</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="Optional note…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              {error && <div className="att-alert att-alert-error">{error}</div>}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
