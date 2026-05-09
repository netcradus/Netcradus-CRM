import React, { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Search, ChevronRight, Edit, Trash2, Globe, Mail, Phone } from "lucide-react";
import { apiUrl } from "../../config/api";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ accountName: "", accountOwner: "", industry: "", email: "", phone: "" });

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/accounts"));
      const data = await res.json();
      setAccounts(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAccount ? apiUrl(`/api/accounts/${editingAccount._id}`) : apiUrl("/api/accounts");
      const method = editingAccount ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      fetchAccounts();
      setShowModal(false);
    } catch (err) { console.error(err); }
  };

  const filtered = accounts.filter(acc => acc.accountName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>CRM</span><ChevronRight size={10} /><span>Accounts</span>
           </div>
           <h1 className="title">Accounts</h1>
           <p className="subtitle">Manage your client organizations and key account details.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => { setEditingAccount(null); setForm({ accountName: "", accountOwner: "", industry: "", email: "", phone: "" }); setShowModal(true); }}><Plus size={16} /> Add Account</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Total Accounts</span><span className="metric-value">{accounts.length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Industries</span><span className="metric-value">{new Set(accounts.map(a => a.industry)).size}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Active Owners</span><span className="metric-value">{new Set(accounts.map(a => a.accountOwner)).size}</span></div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ position: 'relative', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Account Name</th><th>Owner</th><th>Industry</th><th>Contact</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {filtered.map(acc => (
                 <tr key={acc._id}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={14} color="var(--color-accent)" /></div>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{acc.accountName}</span>
                       </div>
                    </td>
                    <td><span className="badge badge-neutral">{acc.accountOwner}</span></td>
                    <td>{acc.industry}</td>
                    <td>
                       <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          <div>{acc.email}</div>
                          <div>{acc.phone}</div>
                       </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => { setEditingAccount(acc); setForm({ ...acc }); setShowModal(true); }}><Edit size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={async () => { if(window.confirm('Delete?')) { await fetch(apiUrl(`/api/accounts/${acc._id}`), { method: 'DELETE' }); fetchAccounts(); } }}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {filtered.length === 0 && !loading && (
                 <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No accounts found.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
              <div className="nc-modal-header"><h3>{editingAccount ? "Edit Account" : "Add Account"}</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Account Name</label>
                    <input className="form-input" required value={form.accountName} onChange={e => setForm({...form, accountName: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Owner</label>
                    <input className="form-input" required value={form.accountOwner} onChange={e => setForm({...form, accountOwner: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Industry</label>
                    <input className="form-input" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Email</label>
                       <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Phone</label>
                       <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingAccount ? "Update" : "Create Account"}</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default Accounts;
