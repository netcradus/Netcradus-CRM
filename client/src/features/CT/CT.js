import React, { useState } from "react";
import { Phone, PhoneForwarded, CheckCircle2, Trash2, Search, ChevronRight, Plus, MoreVertical, Clock } from "lucide-react";

const initialCalls = [
  { id: 1, caller: "Rajesh Kumar", phone: "+91 98765 43210", date: "2026-05-08 10:30 AM", status: "Missed", notes: "Called regarding PO #302" },
  { id: 2, caller: "Sunita Verma", phone: "+91 98221 11004", date: "2026-05-08 11:15 AM", status: "Completed", notes: "Discussion on pricing update" },
];

function CT() {
  const [calls, setCalls] = useState(initialCalls);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this call record?")) {
      setCalls(calls.filter((call) => call.id !== id));
    }
  };

  const handleMarkCompleted = (id) => {
    setCalls(calls.map((call) => call.id === id ? { ...call, status: "Completed" } : call));
  };

  const handleCallBack = (phone) => {
    alert(`Initiating call to ${phone}...`);
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Sales</span><ChevronRight size={10} /><span>Call Tracking</span>
           </div>
           <h1 className="title">Call Logs</h1>
           <p className="subtitle">Track inbound and outbound communication with leads and customers.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary"><Plus size={16} /> Log Call</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Total Logs</span><span className="metric-value">{calls.length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Missed</span><span className="metric-value" style={{ color: 'var(--color-error)' }}>{calls.filter(c => c.status === 'Missed').length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Completed</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{calls.filter(c => c.status === 'Completed').length}</span></div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Caller</th><th>Contact</th><th>Time</th><th>Status</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {calls.map((call) => (
                 <tr key={call.id}>
                    <td><div style={{ fontWeight: 'var(--font-semibold)' }}>{call.caller}</div></td>
                    <td><div style={{ fontSize: 'var(--text-sm)' }}>{call.phone}</div></td>
                    <td><div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{call.date}</div></td>
                    <td><span className={`badge badge-${call.status === 'Completed' ? 'success' : call.status === 'Missed' ? 'error' : 'warning'}`}>{call.status}</span></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{call.notes}</td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-accent)' }} onClick={() => handleCallBack(call.phone)}><PhoneForwarded size={14} /></button>
                          {call.status !== 'Completed' && (
                            <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-success)' }} onClick={() => handleMarkCompleted(call.id)}><CheckCircle2 size={14} /></button>
                          )}
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={() => handleDelete(call.id)}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {calls.length === 0 && (
                 <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No call records found.</td></tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}

export default CT;
