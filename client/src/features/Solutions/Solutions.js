import React, { useState } from "react";
import { Lightbulb, Plus, Search, ChevronRight, CheckCircle2, Clock, PlayCircle } from "lucide-react";

function Solutions() {
  const [solutions, setSolutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: "", title: "", client: "", date: "", status: "Pending", notes: "" });
  const [filter, setFilter] = useState("All");

  const handleAddSolution = (e) => {
    e.preventDefault();
    const newId = form.id || `S${String(solutions.length + 1).padStart(3, "0")}`;
    setSolutions([...solutions, { ...form, id: newId }]);
    setForm({ id: "", title: "", client: "", date: "", status: "Pending", notes: "" });
    setShowModal(false);
  };

  const filtered = filter === "All" ? solutions : solutions.filter((s) => s.status === filter);

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Delivery</span><ChevronRight size={10} /><span>Solutions</span>
           </div>
           <h1 className="title">Client Solutions</h1>
           <p className="subtitle">Catalogue of delivered and ongoing business solutions for clients.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Solution</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className={`nc-stat-card ${filter === 'All' ? 'is-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFilter('All')}>
            <span className="metric-label">Total Solutions</span>
            <span className="metric-value">{solutions.length}</span>
         </div>
         <div className={`nc-stat-card ${filter === 'Delivered' ? 'is-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFilter('Delivered')}>
            <span className="metric-label">Delivered</span>
            <span className="metric-value" style={{ color: 'var(--color-success)' }}>{solutions.filter(s => s.status === 'Delivered').length}</span>
         </div>
         <div className={`nc-stat-card ${filter === 'In Progress' ? 'is-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFilter('In Progress')}>
            <span className="metric-label">In Progress</span>
            <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{solutions.filter(s => s.status === 'In Progress').length}</span>
         </div>
         <div className={`nc-stat-card ${filter === 'Pending' ? 'is-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFilter('Pending')}>
            <span className="metric-label">Pending</span>
            <span className="metric-value" style={{ color: 'var(--color-info)' }}>{solutions.filter(s => s.status === 'Pending').length}</span>
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>ID</th><th>Solution Title</th><th>Client</th><th>Date</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
               {filtered.map((sol, index) => (
                 <tr key={index}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 'var(--font-bold)' }}>{sol.id}</span></td>
                    <td style={{ fontWeight: 'var(--font-semibold)' }}>{sol.title}</td>
                    <td><span className="badge badge-neutral">{sol.client}</span></td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{sol.date}</td>
                    <td><span className={`badge badge-${sol.status === 'Delivered' ? 'success' : sol.status === 'Pending' ? 'error' : 'warning'}`}>{sol.status}</span></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{sol.notes || "—"}</td>
                 </tr>
               ))}
               {filtered.length === 0 && (
                 <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No solutions found for this category.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
              <div className="nc-modal-header"><h3>Add New Solution</h3></div>
              <form className="form" onSubmit={handleAddSolution}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Solution ID</label>
                       <input className="form-input" placeholder="S001" value={form.id} onChange={e => setForm({...form, id: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Solution Title</label>
                       <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    </div>
                 </div>
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
                       <label className="form-label">Current Status</label>
                       <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Delivered</option>
                       </select>
                    </div>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Internal Notes</label>
                    <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Solution</button>
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
