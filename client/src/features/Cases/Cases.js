import React, { useState } from "react";
import { ClipboardList, Plus, Search, ChevronRight, User, AlertCircle, CheckCircle2 } from "lucide-react";

function Cases() {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({ title: "", assignedTo: "", status: "Open" });

  const filtered = cases.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.assignedTo.toLowerCase().includes(search.toLowerCase()));

  const handleCreateCase = (e) => {
    e.preventDefault();
    const newId = `#C-${2000 + cases.length + 1}`;
    setCases([{ ...newCase, id: newId, created: new Date().toISOString().split("T")[0] }, ...cases]);
    setNewCase({ title: "", assignedTo: "", status: "Open" });
    setIsModalOpen(false);
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Support</span><ChevronRight size={10} /><span>Cases</span>
           </div>
           <h1 className="title">Support Cases</h1>
           <p className="subtitle">Track customer issues, technical bugs, and resolution timelines.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> Create Case</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Open Cases</span><span className="metric-value">{cases.filter(c => c.status === 'Open').length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">In Progress</span><span className="metric-value" style={{ color: 'var(--color-warning)' }}>{cases.filter(c => c.status === 'In Progress').length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Resolved</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{cases.filter(c => c.status === 'Resolved').length}</span></div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ position: 'relative', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search case ID or title..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Case ID</th><th>Title</th><th>Assigned To</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
               {filtered.map((c, idx) => (
                 <tr key={idx}>
                    <td><span style={{ fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{c.id}</span></td>
                    <td style={{ fontWeight: 'var(--font-semibold)' }}>{c.title}</td>
                    <td>{c.assignedTo}</td>
                    <td><span className={`badge badge-${c.status === 'Resolved' ? 'success' : c.status === 'Open' ? 'error' : 'warning'}`}>{c.status}</span></td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{c.created}</td>
                 </tr>
               ))}
               {filtered.length === 0 && (
                 <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No cases found.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="nc-modal-overlay" onClick={() => setIsModalOpen(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>New Case</h3></div>
              <form className="form" onSubmit={handleCreateCase}>
                 <div className="form-field">
                    <label className="form-label">Case Title</label>
                    <input className="form-input" required value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Assigned To</label>
                    <input className="form-input" required value={newCase.assignedTo} onChange={e => setNewCase({...newCase, assignedTo: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Initial Status</label>
                    <select className="form-select" value={newCase.status} onChange={e => setNewCase({...newCase, status: e.target.value})}>
                       <option>Open</option>
                       <option>In Progress</option>
                       <option>Resolved</option>
                    </select>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
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
