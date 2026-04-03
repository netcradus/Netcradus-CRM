import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import "./Attendance.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const userId = localStorage.getItem("userId");
const userRole = localStorage.getItem("userRole");
const isHROrAdmin = ["admin", "hr"].includes(userRole);

const STATUS_BADGE = {
  pending:  { label: "Pending",  cls: "badge-half" },
  approved: { label: "Approved", cls: "badge-present" },
  rejected: { label: "Rejected", cls: "badge-absent" },
  cancelled:{ label: "Cancelled",cls: "badge-weekend" },
};

export default function LeavePage() {
  const [tab, setTab] = useState("my");           // 'my' | 'apply' | 'queue'
  const [myLeaves, setMyLeaves]   = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [balances, setBalances]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  // Apply form
  const [form, setForm] = useState({
    leaveTypeId: "", from: "", to: "", halfDay: false, reason: "",
  });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, balRes, ltRes] = await Promise.all([
        axios.get(`${API}/leave/my`, { headers: getHeaders() }),
        userId ? axios.get(`${API}/leave/balance/${userId}`, { headers: getHeaders() }) : Promise.resolve({ data: { data: [] } }),
        axios.get(`${API}/attendance/settings`, { headers: getHeaders() }).catch(() => ({ data: {} })),
      ]);
      setMyLeaves(myRes.data.data?.applications || []);
      setBalances(balRes.data.data || []);

      // Fetch leave types from server seed endpoint through balance
      if (balRes.data.data?.length) {
        setLeaveTypes(
          balRes.data.data.map(b => ({ _id: b.leaveTypeId._id || b.leaveTypeId, name: b.leaveTypeId.name || b.leaveTypeName || "Leave", remaining: b.remaining }))
        );
      }

      if (isHROrAdmin) {
        const allRes = await axios.get(`${API}/leave/applications`, { headers: getHeaders() });
        setAllLeaves(allRes.data.data || []);
      }
    } catch (e) {
      setError("Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(""); setSuccess("");
    try {
      await axios.post(`${API}/leave/apply`, form, { headers: getHeaders() });
      setSuccess("✅ Leave application submitted successfully!");
      setForm({ leaveTypeId: "", from: "", to: "", halfDay: false, reason: "" });
      await fetchAll();
      setTab("my");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to apply leave.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    setError(""); setSuccess("");
    try {
      await axios.patch(`${API}/leave/${id}/${action}`, {}, { headers: getHeaders() });
      setSuccess(`✅ Leave ${action}d.`);
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || `Failed to ${action} leave.`);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this leave application?")) return;
    handleAction(id, "cancel");
  };

  return (
    <div className="att-page">
      <div className="att-header">
        <div>
          <h1 className="att-title">Leave Management</h1>
          <p className="att-subtitle">Apply, track and manage leave</p>
        </div>
      </div>

      {error   && <div className="att-alert att-alert-error">{error}</div>}
      {success && <div className="att-alert att-alert-success">{success}</div>}

      {/* Balance Cards (Hide for Admin) */}
      {balances.length > 0 && userRole !== 'admin' && (
        <div className="balance-grid">
          {balances.map((b, i) => (
            <div key={i} className="balance-card">
              <div className="balance-type">{b.leaveTypeId?.name || "Leave"}</div>
              <div className="balance-numbers">
                <span className="balance-remaining">{b.remaining ?? "—"}</span>
                <span className="balance-of">/ {b.allocated ?? "—"}</span>
              </div>
              <div className="balance-label">remaining</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="att-tabs">
        <button className={`att-tab ${tab === "my" ? "att-tab-active" : ""}`} onClick={() => setTab("my")}>{userRole === 'admin' ? 'Recent Applications' : 'My Leaves'}</button>
        {userRole !== 'admin' && (
          <button className={`att-tab ${tab === "apply" ? "att-tab-active" : ""}`} onClick={() => setTab("apply")}>Apply Leave</button>
        )}
        {isHROrAdmin && (
          <button className={`att-tab ${tab === "queue" ? "att-tab-active" : ""}`} onClick={() => setTab("queue")}>
            Approval Queue {allLeaves.filter(l => l.status === "pending").length > 0 && <span className="tab-badge">{allLeaves.filter(l => l.status === "pending").length}</span>}
          </button>
        )}
      </div>

      {/* My Leaves */}
      {tab === "my" && (
        <div className="att-section">
          {loading ? <div className="att-loading">Loading…</div> : myLeaves.length === 0 ? (
            <div className="att-empty">No leave applications yet. Click "Apply Leave" to get started.</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {myLeaves.map(l => (
                    <tr key={l._id}>
                      <td>{l.leaveTypeId?.name || "—"}</td>
                      <td>{l.from ? format(parseISO(l.from), "dd MMM yyyy") : "—"}</td>
                      <td>{l.to   ? format(parseISO(l.to),   "dd MMM yyyy") : "—"}</td>
                      <td>{l.totalDays ?? "—"}</td>
                      <td className="reason-cell">{l.reason}</td>
                      <td><span className={`badge ${STATUS_BADGE[l.status]?.cls || ""}`}>{STATUS_BADGE[l.status]?.label || l.status}</span></td>
                      <td>
                        {l.status === "pending" && (
                          <button className="btn-danger-sm" onClick={() => handleCancel(l._id)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Form */}
      {tab === "apply" && (
        <div className="att-section">
          <form className="att-form" onSubmit={handleApply}>
            <div className="form-group">
              <label>Leave Type <span className="required">*</span></label>
              <select required value={form.leaveTypeId} onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}>
                <option value="">Select leave type…</option>
                {leaveTypes.map(lt => (
                  <option key={lt._id} value={lt._id}>{lt.name} ({lt.remaining} days remaining)</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>From <span className="required">*</span></label>
                <input type="date" required value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} />
              </div>
              <div className="form-group">
                <label>To <span className="required">*</span></label>
                <input type="date" required value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} />
              </div>
            </div>
            <div className="form-group form-check">
              <input type="checkbox" id="halfDay" checked={form.halfDay} onChange={e => setForm({ ...form, halfDay: e.target.checked })} />
              <label htmlFor="halfDay">Half Day</label>
            </div>
            <div className="form-group">
              <label>Reason <span className="required">*</span></label>
              <textarea required rows={3} placeholder="Reason for leave…" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Apply Leave"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approval Queue (HR/Admin) */}
      {tab === "queue" && isHROrAdmin && (
        <div className="att-section">
          {loading ? <div className="att-loading">Loading…</div> : allLeaves.length === 0 ? (
            <div className="att-empty">No leave applications found.</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {allLeaves.map(l => (
                    <tr key={l._id}>
                      <td>{l.userId?.name || l.userId?.email || "—"}</td>
                      <td>{l.leaveTypeId?.name || "—"}</td>
                      <td>{l.from ? format(parseISO(l.from), "dd MMM yyyy") : "—"}</td>
                      <td>{l.to   ? format(parseISO(l.to),   "dd MMM yyyy") : "—"}</td>
                      <td>{l.totalDays ?? "—"}</td>
                      <td className="reason-cell">{l.reason}</td>
                      <td><span className={`badge ${STATUS_BADGE[l.status]?.cls || ""}`}>{STATUS_BADGE[l.status]?.label || l.status}</span></td>
                      <td>
                        {l.status === "pending" && (
                          <div className="action-btns">
                            <button className="btn-success-sm" onClick={() => handleAction(l._id, "approve")}>Approve</button>
                            <button className="btn-danger-sm"  onClick={() => handleAction(l._id, "reject")}>Reject</button>
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
      )}
    </div>
  );
}
