import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Lock, LockOpen, Pencil, Trash2, ShieldCheck, Plus, Search, ChevronRight, FileText, Download, Printer, Eye } from "lucide-react";

import { apiUrl } from "../../config/api";

const EMPTY_FORM = { accountName: "", username: "", userEmail: "", password: "", confirmPassword: "", description: "" };
const MASKED = "••••••••••••";

function PasswordManager() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [verifyState, setVerifyState] = useState({ open: false, password: "", error: "", attemptsRemaining: 3 });
  const [pendingAction, setPendingAction] = useState(null);
  const [reAuthToken, setReAuthToken] = useState("");
  const [unlockedRows, setUnlockedRows] = useState({});
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit), q: query, sortBy, order });
      const response = await fetch(apiUrl(`/api/password-manager/list?${params}`), { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const payload = await response.json();
      setRows(payload.rows || []);
      setTotal(payload.total || 0);
    } catch (err) { setError("Failed to load credentials"); }
    finally { setLoading(false); }
  }, [page, limit, query, sortBy, order]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(apiUrl("/api/password-manager/verify-password"), {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ password: verifyState.password })
    });
    const payload = await response.json();
    if (!response.ok) {
      setVerifyState(s => ({ ...s, error: payload.message, attemptsRemaining: payload.attemptsRemaining }));
      return;
    }
    const token = payload.reAuthToken;
    const action = pendingAction;
    setVerifyState({ open: false, password: "", error: "", attemptsRemaining: 3 });
    setPendingAction(null);
    
    if (action.type === "unlock") {
      const res = await fetch(apiUrl(`/api/password-manager/view/${action.row._id}`), { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-ReAuth-Token": token } });
      const data = await res.json();
      setUnlockedRows(c => ({ ...c, [action.row._id]: data }));
    } else if (action.type === "edit") {
       const res = await fetch(apiUrl(`/api/password-manager/view/${action.row._id}`), { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-ReAuth-Token": token } });
       const data = await res.json();
       setReAuthToken(token);
       setEditingRow(action.row);
       setForm({ ...action.row, password: data.password, confirmPassword: data.password });
       setShowEditor(true);
    } else if (action.type === "delete") {
       await fetch(apiUrl(`/api/password-manager/delete/${action.row._id}`), { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-ReAuth-Token": token } });
       fetchRows();
    }
  };

  const submitEditor = async (e) => {
    e.preventDefault();
    const endpoint = editingRow ? `/api/password-manager/update/${editingRow._id}` : "/api/password-manager/create";
    await fetch(apiUrl(endpoint), {
      method: editingRow ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}`, ...(reAuthToken ? { "X-ReAuth-Token": reAuthToken } : {}) },
      body: JSON.stringify(form)
    });
    setShowEditor(false);
    fetchRows();
  };

  const visibleRows = statusFilter === 'all' ? rows : rows.filter(r => statusFilter === 'unlocked' ? !!unlockedRows[r._id] : !unlockedRows[r._id]);

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Security</span><ChevronRight size={10} /><span>Vault</span>
           </div>
           <h1 className="title">Password Manager</h1>
           <p className="subtitle">Securely store and manage shared team credentials with end-to-end encryption.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => { setEditingRow(null); setForm(EMPTY_FORM); setShowEditor(true); }}><Plus size={16} /> New Credential</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Total Vault Items</span><span className="metric-value">{total}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Unlocked Items</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{Object.keys(unlockedRows).length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Security Health</span><span className="metric-value" style={{ color: 'var(--color-info)' }}>Strong</span></div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
         <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search accounts, usernames..." value={query} onChange={e => setQuery(e.target.value)} />
         </div>
         <select className="form-select" style={{ width: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Items</option><option value="locked">Locked</option><option value="unlocked">Unlocked</option>
         </select>
         <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} /></button>
         <button className="btn btn-ghost"><Download size={16} /></button>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Account</th><th>Username / Email</th><th>Password</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {visibleRows.map((row) => {
                 const unlocked = unlockedRows[row._id];
                 return (
                   <tr key={row._id}>
                      <td>
                         <div style={{ fontWeight: 'var(--font-semibold)' }}>{row.accountName}</div>
                         <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{row.description || "No notes"}</div>
                      </td>
                      <td>
                         <div style={{ fontSize: 'var(--text-sm)' }}>{row.username}</div>
                         <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{row.userEmail}</div>
                      </td>
                      <td>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>{unlocked ? unlocked.password : MASKED}</span>
                            {unlocked && <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => navigator.clipboard.writeText(unlocked.password)}><Copy size={12} /></button>}
                         </div>
                      </td>
                      <td>
                         <span className={`badge badge-${unlocked ? 'success' : 'ghost'}`} onClick={() => setPendingAction({ type: 'unlock', row })} style={{ cursor: 'pointer' }}>
                            {unlocked ? <LockOpen size={10} style={{ marginRight: '4px' }} /> : <Lock size={10} style={{ marginRight: '4px' }} />}
                            {unlocked ? 'Unlocked' : 'Locked'}
                         </span>
                      </td>
                      <td>
                         <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button className="btn btn-ghost" onClick={() => { setPendingAction({ type: 'unlock', row }); setVerifyState(s => ({ ...s, open: true })); }}><Eye size={14} /></button>
                            <button className="btn btn-ghost" onClick={() => { setPendingAction({ type: 'edit', row }); setVerifyState(s => ({ ...s, open: true })); }}><Pencil size={14} /></button>
                            <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={() => { if(window.confirm("Delete?")) { setPendingAction({ type: 'delete', row }); setVerifyState(s => ({ ...s, open: true })); } }}><Trash2 size={14} /></button>
                         </div>
                      </td>
                   </tr>
                 );
               })}
               {visibleRows.length === 0 && !loading && (
                 <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No vault items found.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {verifyState.open && createPortal(
        <div className="nc-modal-overlay" onClick={() => setVerifyState(s => ({ ...s, open: false }))}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>Confirm Identity</h3></div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>Please enter your master password to proceed with this sensitive action.</p>
              <form className="form" onSubmit={handleVerifySubmit}>
                 <div className="form-field">
                    <label className="form-label">Master Password</label>
                    <input className="form-input" type="password" required value={verifyState.password} onChange={e => setVerifyState(s => ({ ...s, password: e.target.value }))} />
                    {verifyState.error && <span className="form-error">{verifyState.error}</span>}
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Unlock Vault</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setVerifyState(s => ({ ...s, open: false }))}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>, document.body
      )}

      {showEditor && createPortal(
        <div className="nc-modal-overlay" onClick={() => setShowEditor(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header"><h3>{editingRow ? 'Edit Credential' : 'New Credential'}</h3></div>
              <form className="form" onSubmit={submitEditor}>
                 <div className="form-field">
                    <label className="form-label">Account Name</label>
                    <input className="form-input" required value={form.accountName} onChange={e => setForm({...form, accountName: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Username</label>
                       <input className="form-input" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Email</label>
                       <input className="form-input" type="email" value={form.userEmail} onChange={e => setForm({...form, userEmail: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Password</label>
                       <input className="form-input" type="text" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Confirm Password</label>
                       <input className="form-input" type="text" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                    </div>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Notes</label>
                    <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Item</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowEditor(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>, document.body
      )}
    </div>
  );
}

export default PasswordManager;
