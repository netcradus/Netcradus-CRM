import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Users, Search, Plus, Lock, Unlock, ChevronRight, Mail, Phone, MapPin, Download, X, Briefcase, Building2, ShieldAlert } from "lucide-react";
import { apiUrl } from "../../config/api";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [sensitiveData, setSensitiveData] = useState(null);
  const [reAuthToken, setReAuthToken] = useState(null);
  const [reAuthError, setReAuthError] = useState("");
  const [loading, setLoading] = useState(true);

  const [newContact, setNewContact] = useState({ name: "", email: "", status: "Prospect", department: "", designation: "", joiningDate: "", leavingDate: "", interviewSchedule: "", contactNumber: "", address: "", salary: "", leaves: 0 });

  const userRole = String(localStorage.getItem("userRole") || "").trim().toLowerCase();
  const canUnlockSensitive = ["super_user", "admin", "hr"].includes(userRole);
  const canAddContact = userRole === "admin";

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/contacts"), { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      setContacts(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleReAuth = async (e) => {
    e.preventDefault();
    setReAuthError("");
    try {
      const res = await fetch(apiUrl("/api/auth/verify-password-reauth"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ password: reAuthPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setReAuthToken(data.reAuthToken);
        setShowReAuthModal(false);
        setReAuthPassword("");
        fetchSensitiveData(selectedContactId, data.reAuthToken);
      } else { setReAuthError(data.message || "Invalid password"); }
    } catch (err) { setReAuthError("Verification failed."); }
  };

  const fetchSensitiveData = async (contactId, token) => {
    try {
      const res = await fetch(apiUrl(`/api/contacts/${contactId}/sensitive`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-ReAuth-Token": token },
      });
      const data = await res.json();
      if (res.ok) { setSensitiveData(data); return; }
      if (res.status === 403 && data.triggerReAuth) {
        setSensitiveData(null);
        setSelectedContactId(contactId);
        setShowReAuthModal(true);
        return;
      }
      setReAuthError(data.message || "Unable to unlock details.");
    } catch (err) { console.error(err); }
  };

  const openReAuth = (contactId) => {
    if (!canUnlockSensitive) return;
    if (sensitiveData && sensitiveData._id === contactId) { setSensitiveData(null); setSelectedContactId(null); return; }
    setSelectedContactId(contactId);
    if (reAuthToken) { fetchSensitiveData(contactId, reAuthToken); return; }
    setShowReAuthModal(true);
  };

  const filtered = contacts.filter(c => `${c.name} ${c.email} ${c.department} ${c.designation}`.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/contacts"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(newContact),
      });
      if (res.ok) { fetchContacts(); setShowModal(false); }
    } catch (err) { console.error(err); }
  };

  const downloadSalarySlip = async (slipId, filename) => {
    try {
      const res = await fetch(apiUrl(`/api/contacts/salary-slips/${slipId}/download`), { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `salary-slip.pdf`;
      link.click();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>HR</span><ChevronRight size={10} /><span>Directory</span>
           </div>
           <h1 className="title">Employees & Contacts</h1>
           <p className="subtitle">Manage internal team directory and external stakeholder contacts.</p>
        </div>
        <div className="page-header-right">
           {canAddContact && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Contact</button>}
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ position: 'relative', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search directory..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Contact</th><th>Department</th><th>Designation</th><th>Status</th><th>Joining</th><th>Privileged</th></tr>
            </thead>
            <tbody>
               {filtered.map(c => (
                 <tr key={c._id} style={{ opacity: c.isActive ? 1 : 0.6 }}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'var(--font-bold)', color: 'var(--color-accent)' }}>
                             {c.name?.[0]}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                             <span style={{ fontWeight: 'var(--font-semibold)' }}>{c.name}</span>
                             <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{c.email}</span>
                          </div>
                       </div>
                    </td>
                    <td><span className="badge badge-neutral">{c.department || "—"}</span></td>
                    <td>{c.designation || "—"}</td>
                    <td><span className={`badge badge-${c.status?.toLowerCase() === 'customer' ? 'info' : 'success'}`}>{c.status || "Employee"}</span></td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{c.joiningDate ? new Date(c.joiningDate).toLocaleDateString() : "—"}</td>
                    <td>
                       <button className="btn btn-ghost" disabled={!canUnlockSensitive} onClick={() => openReAuth(c._id)} style={{ padding: 'var(--space-1)' }}>
                          {sensitiveData?._id === c._id ? <Unlock size={14} color="var(--color-success)" /> : <Lock size={14} />}
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {sensitiveData && createPortal(
        <div className="nc-modal-overlay" onClick={() => setSensitiveData(null)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <ShieldAlert size={20} color="var(--color-warning)" />
                    <h3 style={{ margin: 0 }}>Privileged Access: {sensitiveData.name}</h3>
                 </div>
                 <button className="btn btn-ghost" onClick={() => setSensitiveData(null)}><X size={16} /></button>
              </div>
              <div className="contacts-sensitive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                 <div className="nc-card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-elevated)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Current Salary</span>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>₹ {Number(sensitiveData.salary || 0).toLocaleString()}</div>
                 </div>
                 <div className="nc-card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-elevated)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Leave Balance</span>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>{sensitiveData.leaves || 0} Days</div>
                 </div>
              </div>
              <div style={{ marginTop: 'var(--space-6)', overflowWrap: 'anywhere' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}><Phone size={14} color="var(--color-text-muted)" /> <span>{sensitiveData.contactNumber || "N/A"}</span></div>
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}><MapPin size={14} color="var(--color-text-muted)" style={{ marginTop: '4px' }} /> <span>{sensitiveData.address || "N/A"}</span></div>
              </div>
              <div style={{ marginTop: 'var(--space-6)' }}>
                 <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>Salary Slips</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {sensitiveData.salarySlips?.map((s, i) => (
                      <div key={i} className="nc-card" style={{ padding: 'var(--space-2) var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-base)' }}>
                         <span style={{ fontSize: 'var(--text-xs)', overflowWrap: 'anywhere' }}>{s.filename}</span>
                         <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => downloadSalarySlip(s._id, s.filename)}><Download size={14} /></button>
                      </div>
                    ))}
                    {(!sensitiveData.salarySlips || sensitiveData.salarySlips.length === 0) && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No documents found.</p>}
                 </div>
              </div>
           </div>
        </div>, document.body
      )}

      {showReAuthModal && createPortal(
        <div className="nc-modal-overlay">
           <div className="nc-modal-content" style={{ width: '360px' }}>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Verify Identity</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>Please enter your administrative password to access sensitive employee information.</p>
              <form onSubmit={handleReAuth}>
                 <input className="form-input" type="password" placeholder="Password" autoFocus value={reAuthPassword} onChange={e => setReAuthPassword(e.target.value)} required />
                 {reAuthError && <p style={{ color: 'var(--color-error)', fontSize: '10px', marginTop: 'var(--space-2)' }}>{reAuthError}</p>}
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Unlock Data</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowReAuthModal(false); setReAuthPassword(""); }}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>, document.body
      )}
    </div>
  );
}

export default Contacts;
