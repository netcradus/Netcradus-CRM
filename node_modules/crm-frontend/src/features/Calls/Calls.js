import React, { useState } from "react";
import { Phone, Plus, Search, ChevronRight, Clock, User, PhoneCall, PhoneForwarded } from "lucide-react";

function Calls() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calls] = useState([
    { id: 1, caller: "Alice", recipient: "Bob", date: "2026-02-26", status: "Scheduled", duration: "10m" },
    { id: 2, caller: "Charlie", recipient: "David", date: "2026-02-25", status: "Completed", duration: "5m" },
  ]);

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Activities</span><ChevronRight size={10} /><span>Calls</span>
           </div>
           <h1 className="title">Call Log</h1>
           <p className="subtitle">Track client communications, phone outreach, and scheduled follow-ups.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> Log Call</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)' }}>
         <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search callers or recipients..." />
         </div>
         <select className="form-select" style={{ width: '160px' }}>
            <option>All Status</option>
            <option>Completed</option>
            <option>Scheduled</option>
            <option>Missed</option>
         </select>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Caller</th><th>Recipient</th><th>Schedule</th><th>Status</th><th>Duration</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {calls.map((call) => (
                 <tr key={call.id}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={12} color="var(--color-accent)" /></div>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{call.caller}</span>
                       </div>
                    </td>
                    <td>{call.recipient}</td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{call.date}</td>
                    <td><span className={`badge badge-${call.status?.toLowerCase() === 'completed' ? 'success' : 'warning'}`}>{call.status}</span></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px' }}><Clock size={12} /> {call.duration}</div></td>
                    <td><button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}>View</button></td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="nc-modal-overlay" onClick={() => setIsModalOpen(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>Log New Call</h3></div>
              <form className="form">
                 <div className="form-field">
                    <label className="form-label">Caller Name</label>
                    <input className="form-input" placeholder="e.g. Sales Agent" />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Recipient Name</label>
                    <input className="form-input" placeholder="e.g. Client" />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Status</label>
                    <select className="form-select">
                       <option>Scheduled</option>
                       <option>Completed</option>
                       <option>Missed</option>
                    </select>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Log</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default Calls;
