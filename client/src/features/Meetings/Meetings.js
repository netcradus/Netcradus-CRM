import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Calendar, Edit, Trash2, Search, ChevronRight, User, Briefcase, Phone, Mail, Clock, Plus } from "lucide-react";

import { apiUrl } from "../../config/api";

const initialMeetingState = { title: "", clientName: "", company: "", phone: "", email: "", projectTitle: "", projectDetails: "", participants: "", visitDate: "", date: "", status: "Upcoming" };

const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [form, setForm] = useState(initialMeetingState);
  const [submitting, setSubmitting] = useState(false);

  const loadMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl("/api/meetings"), getHeaders());
      setMeetings(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  const filtered = useMemo(() => {
    return meetings.filter(m => {
      const matchesFilter = filter === "All" || m.status === filter;
      const needle = search.toLowerCase();
      return matchesFilter && (m.title?.toLowerCase().includes(needle) || m.company?.toLowerCase().includes(needle));
    });
  }, [filter, meetings, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMeeting) {
        await axios.put(apiUrl(`/api/meetings/${editingMeeting._id}`), form, getHeaders());
      } else {
        await axios.post(apiUrl("/api/meetings"), form, getHeaders());
      }
      loadMeetings();
      setShowModal(false);
      setEditingMeeting(null);
    } catch (err) { alert("Save failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Sales</span><ChevronRight size={10} /><span>Meetings</span>
           </div>
           <h1 className="title">Meetings</h1>
           <p className="subtitle">Schedule and track client engagements.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => { setEditingMeeting(null); setForm(initialMeetingState); setShowModal(true); }}><Plus size={16} /> Schedule Meeting</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Upcoming</span><span className="metric-value">{meetings.filter(m => m.status === 'Upcoming').length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Today</span><span className="metric-value">{meetings.filter(m => m.date?.substring(0, 10) === new Date().toISOString().substring(0, 10)).length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Completed</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{meetings.filter(m => m.status === 'Completed').length}</span></div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {["All", "Upcoming", "Completed", "Cancelled"].map(t => (
              <button key={t} className={`btn ${filter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(t)} style={{ height: '32px', fontSize: 'var(--text-xs)' }}>{t}</button>
            ))}
         </div>
         <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px', height: '32px' }} placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Meeting</th><th>Client / Company</th><th>Schedule</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {filtered.map(m => (
                 <tr key={m._id}>
                    <td>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{m.title}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{m.projectTitle || "No Project"}</span>
                       </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{m.clientName}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{m.company}</span>
                       </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px' }}>
                          <Calendar size={12} color="var(--color-accent)" />
                          {m.date ? new Date(m.date).toLocaleDateString() : "—"}
                       </div>
                    </td>
                    <td><span className={`badge badge-${m.status?.toLowerCase() === 'completed' ? 'success' : m.status?.toLowerCase() === 'cancelled' ? 'error' : 'warning'}`}>{m.status}</span></td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => { setEditingMeeting(m); setForm({...m, date: m.date?.substring(0, 10), visitDate: m.visitDate?.substring(0, 10)}); setShowModal(true); }}><Edit size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={async () => { if(window.confirm('Delete?')) { await axios.delete(apiUrl(`/api/meetings/${m._id}`), getHeaders()); loadMeetings(); } }}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
              <div className="nc-modal-header"><h3>{editingMeeting ? "Edit Meeting" : "Schedule Meeting"}</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Meeting Title</label>
                       <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Client Name</label>
                       <input className="form-input" required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Company</label>
                       <input className="form-input" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Meeting Date</label>
                       <input className="form-input" type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Phone</label>
                       <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Email</label>
                       <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                       <option>Upcoming</option>
                       <option>Completed</option>
                       <option>Cancelled</option>
                    </select>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Notes</label>
                    <textarea className="form-input" rows={3} value={form.projectDetails} onChange={e => setForm({...form, projectDetails: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingMeeting ? "Update Meeting" : "Schedule Meeting"}</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default Meetings;
