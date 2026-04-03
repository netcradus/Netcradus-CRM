import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import "./Attendance.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

const STATUS_BADGE = {
  present: { label: "Present", cls: "badge-present" },
  absent: { label: "Absent", cls: "badge-absent" },
  half_day: { label: "Half Day", cls: "badge-half" },
  on_leave: { label: "On Leave", cls: "badge-leave" },
  holiday: { label: "Holiday", cls: "badge-holiday" },
  weekend: { label: "Weekend", cls: "badge-weekend" },
};

export default function AttendancePage() {
  const [today, setToday] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm, setRegForm] = useState({ date: "", punchIn: "", punchOut: "", reason: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/attendance/today`, { headers: getAuthHeaders() });
      setToday(data.data);
    } catch (e) {
      setToday(null);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/attendance/my?page=${page}&limit=${LIMIT}`, { headers: getAuthHeaders() });
      setRecords(data.data || []);
    } catch (e) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchToday();
    fetchRecords();
  }, [fetchToday, fetchRecords]);

  const handlePunch = async (type) => {
    setPunching(true);
    setError(""); setSuccess("");
    try {
      await axios.post(`${API}/attendance/${type}`, {}, { headers: getAuthHeaders() });
      setSuccess(type === "punch-in" ? "✅ Punched in successfully!" : "✅ Punched out successfully!");
      await fetchToday();
      await fetchRecords();
    } catch (e) {
      setError(e.response?.data?.message || "Punch action failed.");
    } finally {
      setPunching(false);
    }
  };

  const handleRegularize = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setError(""); setSuccess("");
    try {
      await axios.post(`${API}/attendance/regularize`, regForm, { headers: getAuthHeaders() });
      setSuccess("✅ Regularization request submitted!");
      setShowRegForm(false);
      setRegForm({ date: "", punchIn: "", punchOut: "", reason: "" });
    } catch (e) {
      setError(e.response?.data?.message || "Request failed.");
    } finally {
      setRegLoading(false);
    }
  };

  const nowStatus = today?.status;
  const userRole = localStorage.getItem("userRole");
  const isPunchedIn = today?.punchIn && !today?.punchOut;
  const isPunchedOut = today?.punchOut;

  if (userRole === "admin") {
    return (
      <div className="att-page">
        <div className="att-header">
          <h1 className="att-title">Attendance Control</h1>
          <p className="att-subtitle">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="att-exempt-card glass-panel">
          <div className="exempt-icon">🛡️</div>
          <h2>Exempt Account</h2>
          <p>As an administrator, you are exempt from attendance tracking. Use the Team Dashboard to monitor your staff in real-time.</p>
          <button className="btn-primary" onClick={() => window.location.href = "/admin/attendance"}>
            Go to Team Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="att-page">
      {/* Header */}
      <div className="att-header">
        <div>
          <h1 className="att-title">Attendance</h1>
          <p className="att-subtitle">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <button className="btn-secondary" onClick={() => setShowRegForm(true)}>
          + Regularize
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="att-alert att-alert-error">{error}</div>}
      {success && <div className="att-alert att-alert-success">{success}</div>}

      {/* Today Card */}
      <div className="att-today-card">
        <div className="att-today-left">
          <div className="att-today-status">
            {nowStatus ? (
              <span className={`badge ${STATUS_BADGE[nowStatus]?.cls}`}>
                {STATUS_BADGE[nowStatus]?.label || nowStatus}
              </span>
            ) : (
              <span className="badge badge-absent">Not Marked</span>
            )}
          </div>
          <div className="att-today-times">
            <div className="att-time-item">
              <span className="att-time-label">Punch In</span>
              <span className="att-time-value">
                {today?.punchIn ? format(parseISO(today.punchIn), "hh:mm a") : "—"}
              </span>
            </div>
            <div className="att-time-divider">→</div>
            <div className="att-time-item">
              <span className="att-time-label">Punch Out</span>
              <span className="att-time-value">
                {today?.punchOut ? format(parseISO(today.punchOut), "hh:mm a") : "—"}
              </span>
            </div>
            <div className="att-time-divider">|</div>
            <div className="att-time-item">
              <span className="att-time-label">Hours</span>
              <span className="att-time-value">{today?.workingHours?.toFixed(2) || "—"} h</span>
            </div>
          </div>
        </div>

        <div className="att-punch-btns">
          {!isPunchedIn && !isPunchedOut && (
            <button
              className="btn-punch btn-punch-in"
              disabled={punching}
              onClick={() => handlePunch("punch-in")}
            >
              {punching ? "⏳" : "▶"} Punch In
            </button>
          )}
          {isPunchedIn && (
            <button
              className="btn-punch btn-punch-out"
              disabled={punching}
              onClick={() => handlePunch("punch-out")}
            >
              {punching ? "⏳" : "⏹"} Punch Out
            </button>
          )}
          {isPunchedOut && (
            <span className="att-done-label">✅ Day Complete</span>
          )}
        </div>
      </div>

      {/* Monthly Records Table */}
      <div className="att-section">
        <h2 className="att-section-title">My Attendance History</h2>
        {loading ? (
          <div className="att-loading">Loading records…</div>
        ) : records.length === 0 ? (
          <div className="att-empty">No records found.</div>
        ) : (
          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Overtime</th>
                  <th>Late</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>{r.shiftDate ? format(parseISO(r.shiftDate), "dd MMM yyyy") : "—"}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[r.status]?.cls || ""}`}>
                        {STATUS_BADGE[r.status]?.label || r.status}
                      </span>
                    </td>
                    <td>{r.punchIn ? format(parseISO(r.punchIn), "hh:mm a") : "—"}</td>
                    <td>{r.punchOut ? format(parseISO(r.punchOut), "hh:mm a") : "—"}</td>
                    <td>{r.workingHours != null ? `${r.workingHours.toFixed(2)} h` : "—"}</td>
                    <td>{r.overtimeHours > 0 ? `+${r.overtimeHours.toFixed(2)} h` : "—"}</td>
                    <td>{r.isLate ? <span className="badge badge-absent">Late</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="att-pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-page">← Prev</button>
              <span>Page {page}</span>
              <button disabled={records.length < LIMIT} onClick={() => setPage(p => p + 1)} className="btn-page">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Regularization Modal */}
      {showRegForm && (
        <div className="att-modal-overlay" onClick={() => setShowRegForm(false)}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <h3>Request Regularization</h3>
              <button onClick={() => setShowRegForm(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleRegularize} className="att-form">
              <div className="form-group">
                <label>Date</label>
                <input type="date" required value={regForm.date} onChange={e => setRegForm({ ...regForm, date: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Punch In Time</label>
                  <input type="time" value={regForm.punchIn} onChange={e => setRegForm({ ...regForm, punchIn: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Punch Out Time</label>
                  <input type="time" value={regForm.punchOut} onChange={e => setRegForm({ ...regForm, punchOut: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Reason <span className="required">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this regularization is needed…"
                  value={regForm.reason}
                  onChange={e => setRegForm({ ...regForm, reason: e.target.value })}
                />
              </div>
              {error && <div className="att-alert att-alert-error">{error}</div>}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRegForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={regLoading}>
                  {regLoading ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
