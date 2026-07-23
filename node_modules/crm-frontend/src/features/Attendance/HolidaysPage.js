import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO, isAfter } from "date-fns";
import { Plus, Calendar, Clock, CheckCircle2, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const userRole = String(localStorage.getItem("userRole") || "").trim().toLowerCase();
const canManageHolidays = ["super_user", "hr"].includes(userRole);

const TYPE_BADGE = {
  national: { label: "National", variant: "badge-error" },
  restricted: { label: "Restricted", variant: "badge-warning" },
  company: { label: "Company", variant: "badge-info" },
};

const EMPTY_FORM = { name: "", date: "", type: "national", description: "" };

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(apiUrl("/api/holidays"), { headers: getHeaders() });
      setHolidays(data.data || []);
    } catch (e) { setError("Failed to load holidays."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await axios.patch(apiUrl(`/api/holidays/${editId}`), form, { headers: getHeaders() });
      } else {
        await axios.post(apiUrl("/api/holidays"), form, { headers: getHeaders() });
      }
      setShowForm(false);
      fetchHolidays();
    } catch (e) { setError(e.response?.data?.message || "Save failed."); }
    finally { setSaving(false); }
  };

  const now = new Date();
  const filtered = holidays.filter(h => {
    const d = h.date ? parseISO(h.date) : null;
    if (filter === "upcoming") return d && isAfter(d, now);
    if (filter === "past") return d && !isAfter(d, now);
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Attendance</span><ChevronRight size={10} /><span>Holidays</span>
           </div>
           <h1 className="title">Holiday Calendar</h1>
           <p className="subtitle">Official company and national holidays for {now.getFullYear()}.</p>
        </div>
        <div className="page-header-right">
           {canManageHolidays && (
             <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}>
               <Plus size={16} /> Add Holiday
             </button>
           )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
           <span className="metric-label">Total Holidays</span>
           <span className="metric-value">{holidays.length}</span>
        </div>
        <div className="nc-stat-card">
           <span className="metric-label">Upcoming</span>
           <span className="metric-value" style={{ color: 'var(--color-accent)' }}>{holidays.filter(h => h.date && isAfter(parseISO(h.date), now)).length}</span>
        </div>
        <div className="nc-stat-card">
           <span className="metric-label">Completed</span>
           <span className="metric-value" style={{ color: 'var(--color-success)' }}>{holidays.filter(h => h.date && !isAfter(parseISO(h.date), now)).length}</span>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['all', 'upcoming', 'past'].map(t => (
              <button key={t} className={`btn ${filter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(t)} style={{ height: '32px', fontSize: 'var(--text-xs)' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
         {filtered.map(h => {
           const d = h.date ? parseISO(h.date) : null;
           const upcoming = d && isAfter(d, now);
           return (
             <div key={h._id} className="nc-card" style={{ padding: 'var(--space-4)', opacity: upcoming ? 1 : 0.6, borderLeft: upcoming ? '4px solid var(--color-accent)' : '4px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-semibold)' }}>{d ? format(d, "EEEE") : ""}</span>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>{h.name}</span>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent)' }}>{d ? format(d, "dd") : ""}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{d ? format(d, "MMM") : ""}</div>
                   </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)' }}>
                   <span className={`badge ${TYPE_BADGE[h.type]?.variant || 'badge-neutral'}`}>{TYPE_BADGE[h.type]?.label || h.type}</span>
                   {canManageHolidays && (
                     <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => { setForm({ name: h.name, date: h.date?.substring(0, 10), type: h.type, description: h.description || "" }); setEditId(h._id); setShowForm(true); }}><Pencil size={12} /></button>
                        <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={async () => { if(window.confirm('Delete?')) { await axios.delete(apiUrl(`/api/holidays/${h._id}`), { headers: getHeaders() }); fetchHolidays(); } }}><Trash2 size={12} /></button>
                     </div>
                   )}
                </div>
             </div>
           );
         })}
      </div>

      {showForm && (
        <div className="nc-modal-overlay" onClick={() => setShowForm(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>{editId ? "Edit Holiday" : "Add Holiday"}</h3></div>
              <form className="form" onSubmit={handleSave}>
                 <div className="form-field">
                    <label className="form-label">Holiday Name</label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                       <option value="national">National</option>
                       <option value="restricted">Restricted</option>
                       <option value="company">Company</option>
                    </select>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
