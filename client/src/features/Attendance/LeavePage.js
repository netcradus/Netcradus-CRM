import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { apiUrl } from "../../config/api";
import "./Attendance.css";
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_BADGE = {
  pending:  { label: "Pending",  cls: "badge-half" },
  approved: { label: "Approved", cls: "badge-present" },
  rejected: { label: "Rejected", cls: "badge-absent" },
  cancelled:{ label: "Cancelled",cls: "badge-weekend" },
};

export default function LeavePage() {
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  const canReviewLeaves = ["super_user", "admin", "hr"].includes(userRole);
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
  const [typesLoading, setTypesLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setTypesLoading(true);
    try {
      const [myRes, balRes, typesRes] = await Promise.all([
        axios.get(apiUrl("/api/leave/my"), { headers: getHeaders() }),
        userId
          ? axios.get(apiUrl(`/api/leave/balance/${userId}`), { headers: getHeaders() })
          : Promise.resolve({ data: { data: [] } }),
        axios.get(apiUrl("/api/leave/types"), { headers: getHeaders() }),
      ]);
      setMyLeaves(myRes.data.data?.applications || []);
      setBalances(balRes.data.data || []);
      const balanceByTypeId = new Map(
        (balRes.data.data || []).map((balance) => [
          String(balance.leaveTypeId?._id || balance.leaveTypeId),
          balance.remaining,
        ])
      );
      setLeaveTypes(
        (typesRes.data.data || []).map((type) => ({
          _id: type._id,
          name: type.name || "Leave",
          remaining: balanceByTypeId.get(String(type._id)),
          allowHalfDay: Boolean(type.allowHalfDay),
          code: type.code,
        }))
      );

      if (canReviewLeaves) {
        const allRes = await axios.get(apiUrl("/api/leave/applications"), { headers: getHeaders() });
        setAllLeaves(allRes.data.data || []);
      }
    } catch (e) {
      setError("Failed to load leave data.");
    } finally {
      setLoading(false);
      setTypesLoading(false);
    }
  }, [canReviewLeaves, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(""); setSuccess("");
    if (!form.leaveTypeId) {
      setError("Please select a leave type.");
      setSubmitting(false);
      return;
    }
    try {
      await axios.post(apiUrl("/api/leave/apply"), {
        leaveTypeId: form.leaveTypeId,
        from: form.from,
        to: form.to,
        isHalfDay: form.halfDay,
        reason: form.reason,
      }, { headers: getHeaders() });
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
      await axios.patch(apiUrl(`/api/leave/${id}/${action}`), {}, { headers: getHeaders() });
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

  const pendingMyLeaves = myLeaves.filter((leave) => leave.status === "pending").length;
  const approvedMyLeaves = myLeaves.filter((leave) => leave.status === "approved").length;
  const pendingQueueCount = allLeaves.filter((leave) => leave.status === "pending").length;
  const leaveBalanceTotal = balances.reduce((sum, balance) => sum + (Number(balance.remaining) || 0), 0);

  return (
    <div className="att-page">
      <div className="att-header leave-page-header">
        <div className="leave-page-title-wrap">
          <div className="att-eyebrow">Time Away</div>
          <h1 className="att-title">Leave Management</h1>
          <p className="att-subtitle">Apply, track, review and stay on top of leave requests from one workspace.</p>
        </div>
        <div className="leave-header-chip">
          <span className="leave-chip-label">Active Tab</span>
          <strong>{tab === "my" ? (canReviewLeaves ? "Recent Applications" : "My Leaves") : tab === "apply" ? "Apply Leave" : "Approval Queue"}</strong>
        </div>
      </div>

      {error   && <div className="att-alert att-alert-error">{error}</div>}
      {success && <div className="att-alert att-alert-success">{success}</div>}

      <div className="leave-overview-grid">
        <div className="leave-overview-card">
          <span className="leave-overview-label">Pending Requests</span>
          <strong className="leave-overview-value">{canReviewLeaves ? pendingQueueCount : pendingMyLeaves}</strong>
          <span className="leave-overview-meta">{canReviewLeaves ? "awaiting review" : "awaiting approval"}</span>
        </div>
        <div className="leave-overview-card">
          <span className="leave-overview-label">Approved Leaves</span>
          <strong className="leave-overview-value">{approvedMyLeaves}</strong>
          <span className="leave-overview-meta">for your account</span>
        </div>
        <div className="leave-overview-card">
          <span className="leave-overview-label">Available Types</span>
          <strong className="leave-overview-value">{leaveTypes.length}</strong>
          <span className="leave-overview-meta">{typesLoading ? "loading policy" : "ready to apply"}</span>
        </div>
        {userRole !== 'super_user' && (
          <div className="leave-overview-card leave-overview-card--accent">
            <span className="leave-overview-label">Remaining Balance</span>
            <strong className="leave-overview-value">{leaveBalanceTotal}</strong>
            <span className="leave-overview-meta">days across policies</span>
          </div>
        )}
      </div>

      {/* Balance Cards (Hide for Super User) */}
      {balances.length > 0 && userRole !== 'super_user' && (
        <div className="balance-grid leave-balance-grid">
          {balances.map((b, i) => (
            <div key={i} className="balance-card leave-balance-card">
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
      <div className="att-tabs leave-tabs">
        <button className={`att-tab ${tab === "my" ? "att-tab-active" : ""}`} onClick={() => setTab("my")}>{canReviewLeaves ? 'Recent Applications' : 'My Leaves'}</button>
        <button className={`att-tab ${tab === "apply" ? "att-tab-active" : ""}`} onClick={() => setTab("apply")}>Apply Leave</button>
        {canReviewLeaves && (
          <button className={`att-tab ${tab === "queue" ? "att-tab-active" : ""}`} onClick={() => setTab("queue")}>
            Approval Queue {pendingQueueCount > 0 && <span className="tab-badge">{pendingQueueCount}</span>}
          </button>
        )}
      </div>

      {/* My Leaves */}
      {tab === "my" && (
        <div className="att-section leave-section-shell">
          <div className="leave-section-head">
            <div>
              <h3 className="att-section-title">{canReviewLeaves ? 'Recent Applications' : 'My Leaves'}</h3>
              <p className="leave-section-copy">Track dates, reasons, status updates and pending cancellations in one place.</p>
            </div>
            <div className="leave-section-badge">{myLeaves.length} record(s)</div>
          </div>
          {loading ? <div className="att-loading">Loading…</div> : myLeaves.length === 0 ? (
            <div className="att-empty">No leave applications yet. Click "Apply Leave" to get started.</div>
          ) : (
            <div className="att-table-wrap leave-table-wrap">
              <table className="att-table leave-table">
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
        <div className="att-section leave-section-shell">
          <div className="leave-section-head">
            <div>
              <h3 className="att-section-title">Apply for Leave</h3>
              <p className="leave-section-copy">Choose a leave policy, set your dates, and send a complete request in one go.</p>
            </div>
          </div>
          <form className="att-form leave-form" onSubmit={handleApply}>
            <div className="form-group">
              <label>Leave Type <span className="required">*</span></label>
              <select required value={form.leaveTypeId} onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}>
                {!leaveTypes.length && <option value="">{typesLoading ? "Loading leave types..." : "No leave types available"}</option>}
                <option value="">Select leave type…</option>
                {leaveTypes.map(lt => (
                  <option key={lt._id} value={lt._id}>
                    {lt.name}{typeof lt.remaining === "number" ? ` (${lt.remaining} days remaining)` : ""}
                  </option>
                ))}
              </select>
              {!typesLoading && leaveTypes.length === 0 && (
                <small className="admin-muted">Default leave types are being initialized. Refresh once if the list stays empty.</small>
              )}
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

      {/* Approval Queue (HR/Super User) */}
      {tab === "queue" && canReviewLeaves && (
        <div className="att-section leave-section-shell">
          <div className="leave-section-head">
            <div>
              <h3 className="att-section-title">Approval Queue</h3>
              <p className="leave-section-copy">Review incoming leave requests and approve or reject them quickly.</p>
            </div>
            <div className="leave-section-badge">{allLeaves.length} request(s)</div>
          </div>
          {loading ? <div className="att-loading">Loading…</div> : allLeaves.length === 0 ? (
            <div className="att-empty">No leave applications found.</div>
          ) : (
            <div className="att-table-wrap leave-table-wrap">
              <table className="att-table leave-table leave-table--queue">
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
