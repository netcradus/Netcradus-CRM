import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Plus, Clock, CheckCircle2, XCircle, ChevronRight, Calendar, User } from "lucide-react";
import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_BADGE = {
  pending:  { label: "Pending",  variant: "badge-warning" },
  approved: { label: "Approved", variant: "badge-success" },
  rejected: { label: "Rejected", variant: "badge-error" },
  cancelled:{ label: "Cancelled", variant: "badge-neutral" },
};

export default function LeavePage() {
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  const canReviewLeaves = ["super_user", "admin", "hr"].includes(userRole);
  const [tab, setTab] = useState("my");
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ leaveTypeId: "", from: "", to: "", halfDay: false, reason: "" });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, balRes, typesRes] = await Promise.all([
        axios.get(apiUrl("/api/leave/my"), { headers: getHeaders() }),
        userId ? axios.get(apiUrl(`/api/leave/balance/${userId}`), { headers: getHeaders() }) : Promise.resolve({ data: { data: [] } }),
        axios.get(apiUrl("/api/leave/types"), { headers: getHeaders() }),
      ]);
      setMyLeaves(myRes.data.data?.applications || []);
      setBalances(balRes.data.data || []);
      setLeaveTypes(typesRes.data.data || []);
      if (canReviewLeaves) {
        const allRes = await axios.get(apiUrl("/api/leave/applications"), { headers: getHeaders() });
        setAllLeaves(allRes.data.data || []);
      }
    } catch (e) { setError("Failed to load leave data."); }
    finally { setLoading(false); }
  }, [canReviewLeaves, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(apiUrl("/api/leave/apply"), {
        leaveTypeId: form.leaveTypeId,
        from: form.from,
        to: form.to,
        isHalfDay: form.halfDay,
        reason: form.reason,
      }, { headers: getHeaders() });
      setSuccess("Applied successfully!");
      setTab("my");
      fetchAll();
    } catch (e) { setError(e.response?.data?.message || "Failed to apply."); }
    finally { setSubmitting(false); }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.patch(apiUrl(`/api/leave/${id}/${action}`), {}, { headers: getHeaders() });
      fetchAll();
    } catch (e) { setError("Action failed."); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Attendance</span><ChevronRight size={10} /><span>Leave Management</span>
           </div>
           <h1 className="title">Leave Management</h1>
           <p className="subtitle">Track balances and manage time away.</p>
        </div>
        <div className="page-header-right">
           <button className={`btn ${tab === 'apply' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('apply')}><Plus size={16} /> Apply Leave</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
         {balances.map((b, i) => (
           <div key={i} className="nc-stat-card">
              <span className="metric-label">{b.leaveTypeId?.name}</span>
              <span className="metric-value">{b.remaining} / {b.allocated}</span>
              <span className="metric-trend">Days Remaining</span>
           </div>
         ))}
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
         <button className={`btn ${tab === 'my' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('my')}>My History</button>
         {canReviewLeaves && <button className={`btn ${tab === 'queue' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('queue')}>Approval Queue</button>}
      </div>

      {tab === 'my' && (
        <div className="nc-card">
           <table className="nc-table">
              <thead>
                 <tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                 {myLeaves.map(l => (
                   <tr key={l._id}>
                      <td>{l.leaveTypeId?.name}</td>
                      <td>{formatInTimeZone(parseISO(l.from), "Asia/Kolkata", "dd MMM yyyy")}</td>
                      <td>{formatInTimeZone(parseISO(l.to), "Asia/Kolkata", "dd MMM yyyy")}</td>
                      <td>{l.totalDays}</td>
                      <td><span className={`badge ${STATUS_BADGE[l.status]?.variant || ''}`}>{STATUS_BADGE[l.status]?.label || l.status}</span></td>
                      <td>
                         {l.status === 'pending' && <button className="btn btn-ghost btn-danger" onClick={() => handleAction(l._id, 'cancel')}>Cancel</button>}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {tab === 'apply' && (
        <div className="nc-card" style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-6)' }}>
           <h3 style={{ marginBottom: 'var(--space-6)' }}>Apply for Leave</h3>
           <form className="form" onSubmit={handleApply}>
              <div className="form-field">
                 <label className="form-label">Leave Type</label>
                 <select className="form-select" required value={form.leaveTypeId} onChange={e => setForm({...form, leaveTypeId: e.target.value})}>
                    <option value="">Select type...</option>
                    {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                 </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                 <div className="form-field">
                    <label className="form-label">From</label>
                    <input className="form-input" type="date" required value={form.from} onChange={e => setForm({...form, from: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">To</label>
                    <input className="form-input" type="date" required value={form.to} onChange={e => setForm({...form, to: e.target.value})} />
                 </div>
              </div>
              <div className="form-field">
                 <label className="form-label">Reason</label>
                 <textarea className="form-input" rows={3} required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)' }} disabled={submitting}>{submitting ? 'Applying...' : 'Submit Application'}</button>
           </form>
        </div>
      )}

      {tab === 'queue' && (
        <div className="nc-card">
           <table className="nc-table">
              <thead>
                 <tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Actions</th></tr>
              </thead>
              <tbody>
                 {allLeaves.map(l => (
                   <tr key={l._id}>
                      <td>{l.userId?.name}</td>
                      <td>{l.leaveTypeId?.name}</td>
                      <td>{formatInTimeZone(parseISO(l.from), "Asia/Kolkata", "dd MMM")} - {formatInTimeZone(parseISO(l.to), "Asia/Kolkata", "dd MMM")}</td>
                      <td>{l.totalDays}</td>
                      <td style={{ maxWidth: '200px', fontSize: '11px' }}>{l.reason}</td>
                      <td>
                         {l.status === 'pending' && (
                           <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <button className="btn btn-ghost" style={{ color: 'var(--color-success)' }} onClick={() => handleAction(l._id, 'approve')}><CheckCircle2 size={14} /></button>
                              <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={() => handleAction(l._id, 'reject')}><XCircle size={14} /></button>
                           </div>
                         )}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
