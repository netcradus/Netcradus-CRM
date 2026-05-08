import React, { useState } from "react";
import { FileText, Plus, Search, ChevronRight, Download, Printer } from "lucide-react";

function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newQuote, setNewQuote] = useState({ client: "", amount: "", status: "Draft" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setQuotes([{ ...newQuote, id: Date.now(), date: new Date().toISOString() }, ...quotes]);
    setShowModal(false);
    setNewQuote({ client: "", amount: "", status: "Draft" });
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Sales</span><ChevronRight size={10} /><span>Quotes</span>
           </div>
           <h1 className="title">Quotations</h1>
           <p className="subtitle">Create and manage client quotations and proposals.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Quote</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ position: 'relative', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search quotes..." />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Client</th><th>Amount</th><th>Status</th><th>Date Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {quotes.map(q => (
                 <tr key={q.id}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="var(--color-accent)" /></div>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{q.client}</span>
                       </div>
                    </td>
                    <td style={{ fontWeight: 'var(--font-bold)' }}>₹ {Number(q.amount).toLocaleString('en-IN')}</td>
                    <td><span className={`badge badge-${q.status?.toLowerCase() === 'accepted' ? 'success' : 'warning'}`}>{q.status}</span></td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{new Date(q.date).toLocaleDateString()}</td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}><Printer size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}><Download size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {quotes.length === 0 && (
                 <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No quotes found. Start by creating a new one.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>New Quotation</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Client Name</label>
                    <input className="form-input" required value={newQuote.client} onChange={e => setNewQuote({...newQuote, client: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Proposed Amount (₹)</label>
                    <input className="form-input" type="number" required value={newQuote.amount} onChange={e => setNewQuote({...newQuote, amount: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Initial Status</label>
                    <select className="form-select" value={newQuote.status} onChange={e => setNewQuote({...newQuote, status: e.target.value})}>
                       <option>Draft</option>
                       <option>Sent</option>
                       <option>Accepted</option>
                    </select>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Quote</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default Quotes;
