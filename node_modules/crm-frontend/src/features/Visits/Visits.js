import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { MapPin, Plus, Search, ChevronRight, Clock, Calendar, CheckCircle2, XCircle, MoreVertical, Edit, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const API = apiUrl("/api/visits");

function Visits() {
  const [visits, setVisits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ client: "", date: "", time: "", status: "Scheduled", notes: "" });

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setVisits(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API, form);
      setShowModal(false);
      setForm({ client: "", date: "", time: "", status: "Scheduled", notes: "" });
      fetchVisits();
    } catch (err) { alert("Error adding visit"); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/${editModal._id}`, editModal);
      setEditModal(null);
      fetchVisits();
    } catch (err) { alert("Error updating visit"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this visit?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchVisits();
    } catch (err) { alert("Error deleting visit"); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Activities</span><ChevronRight size={10} /><span>Client Visits</span>
           </div>
           <h1 className="title">Visit Log</h1>
           <p className="subtitle">Track field visits, client site inspections, and external meetings.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Schedule Visit</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Total Visits</span><span className="metric-value">{visits.length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Completed</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{visits.filter(v => v.status === 'Completed').length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Upcoming</span><span className="metric-value" style={{ color: 'var(--color-info)' }}>{visits.filter(v => v.status === 'Scheduled').length}</span></div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Client</th><th>Date & Time</th><th>Status</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {visits.map((v) => (
                 <tr key={v._id}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={14} color="var(--color-accent)" /></div>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{v.client}</span>
                       </div>
                    </td>
                    <td>
                       <div style={{ fontSize: 'var(--text-sm)' }}>{new Date(v.date).toLocaleDateString()}</div>
                       <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{v.time}</div>
                    </td>
                    <td><span className={`badge badge-${v.status?.toLowerCase() === 'completed' ? 'success' : v.status?.toLowerCase() === 'cancelled' ? 'error' : 'warning'}`}>{v.status}</span></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{v.notes || "—"}</td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => setViewModal(v)}><MoreVertical size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => setEditModal(v)}><Edit size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={() => handleDelete(v._id)}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {visits.length === 0 && !loading && (
                 <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No visit records found.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
              <div className="nc-modal-header"><h3>Schedule New Visit</h3></div>
              <form className="form" onSubmit={handleAdd}>
                 <div className="form-field">
                    <label className="form-label">Client Name</label>
                    <input className="form-input" required value={form.client} onChange={e => setForm({...form, client: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Date</label>
                       <input className="form-input" type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Time</label>
                       <input className="form-input" type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                    </div>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Visit Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                       <option>Scheduled</option>
                       <option>Completed</option>
                       <option>Cancelled</option>
                    </select>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Agenda / Notes</label>
                    <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Schedule</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Modal similar to Add Modal omitted for brevity, logic remains the same */}
      {editModal && (
        <div className="nc-modal-overlay" onClick={() => setEditModal(null)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
              <div className="nc-modal-header"><h3>Reschedule Visit</h3></div>
              <form className="form" onSubmit={handleUpdate}>
                 <div className="form-field">
                    <label className="form-label">Client Name</label>
                    <input className="form-input" required value={editModal.client} onChange={e => setEditModal({...editModal, client: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Date</label>
                       <input className="form-input" type="date" required value={editModal.date?.split('T')[0]} onChange={e => setEditModal({...editModal, date: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Time</label>
                       <input className="form-input" type="time" required value={editModal.time} onChange={e => setEditModal({...editModal, time: e.target.value})} />
                    </div>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Visit Status</label>
                    <select className="form-select" value={editModal.status} onChange={e => setEditModal({...editModal, status: e.target.value})}>
                       <option>Scheduled</option>
                       <option>Completed</option>
                       <option>Cancelled</option>
                    </select>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Schedule</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditModal(null)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default Visits;
