import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Coffee, LogIn, LogOut, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";
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

const BREAK_TYPES = [
  { value: "lunch", label: "Lunch (1 hr)" },
  { value: "short", label: "Short Break" },
  { value: "custom", label: "Custom" },
];

const formatSeconds = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  return [hrs, mins, secs].map((value) => String(value).padStart(2, "0")).join(":");
};

const formatMinutesSummary = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (!hrs) return `${mins} min`;
  if (!mins) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
};

export default function AttendancePage() {
  const [statusData, setStatusData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRegForm, setShowRegForm] = useState(false);
  const [showBreakLog, setShowBreakLog] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState("lunch");
  const [regForm, setRegForm] = useState({ date: "", punchIn: "", punchOut: "", reason: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(Date.now());
  const [punchOutSummary, setPunchOutSummary] = useState(null);
  const LIMIT = 20;

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/attendance/current-status`, { headers: getAuthHeaders() });
      setStatusData(data.data);
    } catch (e) {
      setStatusData(null);
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
    fetchStatus();
    fetchRecords();
  }, [fetchStatus, fetchRecords]);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (type, body = {}) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post(`${API}/attendance/${type}`, body, { headers: getAuthHeaders() });
      setSuccess(data.message || "Action completed.");
      if (type === "punch-out") {
        setPunchOutSummary(data.data || null);
      }
      await fetchStatus();
      await fetchRecords();
    } catch (e) {
      setError(e.response?.data?.message || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegularize = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(`${API}/attendance/regularize`, regForm, { headers: getAuthHeaders() });
      setSuccess("Regularization request submitted.");
      setShowRegForm(false);
      setRegForm({ date: "", punchIn: "", punchOut: "", reason: "" });
    } catch (e) {
      setError(e.response?.data?.message || "Request failed.");
    } finally {
      setRegLoading(false);
    }
  };

  const liveMetrics = useMemo(() => {
    if (!statusData?.record) {
      return { workSeconds: 0, breakSeconds: 0, overtimeSeconds: 0, totalBreakMinutes: 0 };
    }

    const record = statusData.record;
    const serverTimeMs = statusData.serverTime ? new Date(statusData.serverTime).getTime() : Date.now();
    const deltaSeconds = Math.max(0, Math.floor((tick - serverTimeMs) / 1000));
    const isOpenShift = record.punchIn && !record.punchOut;
    const isOnBreak = record.isOnBreak;

    const baseWorkSeconds = statusData.elapsedWorkSeconds || 0;
    const baseBreakSeconds = statusData.ongoingBreakDurationSeconds || 0;
    const workSeconds = isOpenShift && !isOnBreak ? baseWorkSeconds + deltaSeconds : baseWorkSeconds;
    const breakSeconds = isOnBreak ? baseBreakSeconds + deltaSeconds : 0;
    const totalBreakMinutes = (statusData.totalBreakDurationMinutes || 0) + (isOnBreak ? deltaSeconds / 60 : 0);
    const overtimeSeconds = Math.max(0, workSeconds - (8 * 60 * 60));

    return { workSeconds, breakSeconds, overtimeSeconds, totalBreakMinutes };
  }, [statusData, tick]);

  const record = statusData?.record;
  const breaks = statusData?.breaks || [];
  const nowStatus = record?.status;
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName") || "User";
  const isPunchedIn = record?.punchIn && !record?.punchOut;
  const isPunchedOut = Boolean(record?.punchOut);
  const isOnBreak = Boolean(record?.isOnBreak);

  if (userRole === "admin") {
    return (
      <div className="att-page">
        <div className="att-header">
          <h1 className="att-title">Attendance Control</h1>
          <p className="att-subtitle">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="att-exempt-card glass-panel">
          <div className="exempt-icon">Shield</div>
          <h2>Exempt Account</h2>
          <p>As an administrator, you are exempt from attendance tracking. Use the Team Dashboard to monitor staff in real time.</p>
          <button className="btn-primary" onClick={() => window.location.href = "/admin/attendance"}>
            Go to Team Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="att-page">
      <section className="att-hero">
        <div className="att-hero-copy">
          <span className="att-hero-badge">Attendance Workspace</span>
          <h1 className="att-hero-title">
            Welcome, <span>{userName}</span>
          </h1>
          <p className="att-hero-subtitle">Role: <strong>{userRole}</strong></p>
          <p className="att-subtitle">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="att-hero-side">
          <div className="att-live-title">
            <span className="live-dot" />
            <span>Attendance System Live</span>
          </div>
          <div className="att-live-panels">
            <div className="att-summary-box">
              <span className="att-time-label">Work Timer</span>
              <strong className={`att-live-value ${liveMetrics.workSeconds >= (8 * 60 * 60) ? "att-live-value--done" : ""}`}>
                {formatSeconds(liveMetrics.workSeconds)}
              </strong>
            </div>
            <div className={`att-summary-box ${isOnBreak ? "att-summary-box--break" : ""}`}>
              <span className="att-time-label">Break Time</span>
              <strong className={`att-live-value ${isOnBreak ? "att-live-value--break" : ""}`}>
                {formatSeconds(isOnBreak ? liveMetrics.breakSeconds : Math.round(liveMetrics.totalBreakMinutes * 60))}
              </strong>
              <small>{isOnBreak ? "Break running now" : `${formatMinutesSummary(liveMetrics.totalBreakMinutes)} taken today`}</small>
            </div>
          </div>
        </div>
      </section>

      <div className="att-header">
        <div>
          <h2 className="att-section-title">Today Overview</h2>
        </div>
        <button className="btn-secondary" onClick={() => setShowRegForm(true)}>
          + Regularize
        </button>
      </div>

      {error && <div className="att-alert att-alert-error">{error}</div>}
      {success && <div className="att-alert att-alert-success">{success}</div>}

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
            {isOnBreak && <span className="badge badge-half">On Break</span>}
          </div>

          {isOnBreak && (
            <div className="att-today-metrics">
              <div className="att-summary-box att-summary-box--break">
                <span className="att-time-label">Break Timer</span>
                <strong className="att-live-value att-live-value--break">{formatSeconds(liveMetrics.breakSeconds)}</strong>
                <small>Work timer paused</small>
              </div>
            </div>
          )}

          <div className="att-today-times">
            <div className="att-time-item">
              <span className="att-time-label">Punch In</span>
              <span className="att-time-value">{record?.punchIn ? format(parseISO(record.punchIn), "hh:mm a") : "—"}</span>
            </div>
            <div className="att-time-item">
              <span className="att-time-label">Punch Out</span>
              <span className="att-time-value">{record?.punchOut ? format(parseISO(record.punchOut), "hh:mm a") : "—"}</span>
            </div>
            <div className="att-time-item">
              <span className="att-time-label">Total Break</span>
              <span className="att-time-value">{formatMinutesSummary(liveMetrics.totalBreakMinutes)}</span>
            </div>
            <div className="att-time-item">
              <span className="att-time-label">Overtime</span>
              <span className="att-time-value">{liveMetrics.overtimeSeconds > 0 ? formatMinutesSummary(liveMetrics.overtimeSeconds / 60) : "No overtime"}</span>
            </div>
          </div>

          {isPunchedIn && !isPunchedOut && (
            <div className="att-break-row">
              {!isOnBreak && (
                <select className="nc-select att-break-select" value={selectedBreakType} onChange={(e) => setSelectedBreakType(e.target.value)}>
                  {BREAK_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              )}
              {!isOnBreak ? (
                <button className="btn-punch btn-punch-break" disabled={submitting} onClick={() => handleAction("break-start", { breakType: selectedBreakType })}>
                  <Coffee size={16} /> Start Break
                </button>
              ) : (
                <button className="btn-punch btn-punch-resume" disabled={submitting} onClick={() => handleAction("break-end")}>
                  <PlayCircle size={16} /> End Break
                </button>
              )}
            </div>
          )}

          <div className="att-break-log">
            <button type="button" className="att-break-toggle" onClick={() => setShowBreakLog((value) => !value)}>
              <span>Breaks Log</span>
              {showBreakLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showBreakLog && (
              <div className="att-break-list">
                {breaks.length ? breaks.map((item) => (
                  <div key={item._id || `${item.breakStart}-${item.breakType}`} className="att-break-item">
                    <div>
                      <strong>{item.breakType || "Break"}</strong>
                      <span>
                        {item.breakStart ? format(parseISO(item.breakStart), "hh:mm a") : "--"}
                        {" - "}
                        {item.breakEnd ? format(parseISO(item.breakEnd), "hh:mm a") : "In progress"}
                      </span>
                    </div>
                    <em>{formatMinutesSummary(item.breakDurationMinutes || 0)}</em>
                  </div>
                )) : <div className="att-empty-inline">No breaks recorded yet.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="att-punch-btns">
          {!isPunchedIn && !isPunchedOut && (
            <button className="btn-punch btn-punch-in" disabled={submitting} onClick={() => handleAction("punch-in")}>
              <LogIn size={16} /> Punch In
            </button>
          )}
          {isPunchedIn && (
            <button className="btn-punch btn-punch-out" disabled={submitting} onClick={() => handleAction("punch-out")}>
              <LogOut size={16} /> Punch Out
            </button>
          )}
          {isPunchedOut && <span className="att-done-label">Day Complete</span>}
        </div>
      </div>

      {punchOutSummary && (
        <div className="att-summary-card">
          <div className="att-summary-head">
            <h2>Punch Out Summary</h2>
            <button type="button" className="btn-secondary" onClick={() => setPunchOutSummary(null)}>Close</button>
          </div>
          <div className="att-summary-grid">
            <div className="stat-card stat-neutral">
              <div className="stat-value">
                {punchOutSummary.punchIn && punchOutSummary.punchOut
                  ? formatMinutesSummary((new Date(punchOutSummary.punchOut) - new Date(punchOutSummary.punchIn)) / 60000)
                  : "—"}
              </div>
              <div className="stat-label">Total Time in Office</div>
            </div>
            <div className="stat-card stat-warn">
              <div className="stat-value">{formatMinutesSummary(punchOutSummary.totalBreakDurationMinutes || 0)}</div>
              <div className="stat-label">Total Break Time</div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-value">{formatMinutesSummary(punchOutSummary.netWorkDurationMinutes || 0)}</div>
              <div className="stat-label">Net Work Time</div>
            </div>
            <div className="stat-card stat-info">
              <div className="stat-value">{punchOutSummary.overtimeMinutes > 0 ? formatMinutesSummary(punchOutSummary.overtimeMinutes) : "No overtime"}</div>
              <div className="stat-label">Overtime</div>
            </div>
          </div>
        </div>
      )}

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
                  <th>Break Duration</th>
                  <th>Net Work</th>
                  <th>Overtime</th>
                  <th>Late</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>{r.shiftDate ? format(parseISO(r.shiftDate), "dd MMM yyyy") : "—"}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]?.cls || ""}`}>{STATUS_BADGE[r.status]?.label || r.status}</span></td>
                    <td>{r.punchIn ? format(parseISO(r.punchIn), "hh:mm a") : "—"}</td>
                    <td>{r.punchOut ? format(parseISO(r.punchOut), "hh:mm a") : "—"}</td>
                    <td>{formatMinutesSummary(r.totalBreakDurationMinutes || 0)}</td>
                    <td>{r.netWorkDurationMinutes != null ? formatMinutesSummary(r.netWorkDurationMinutes) : (r.workingHours != null ? `${r.workingHours.toFixed(2)} h` : "—")}</td>
                    <td>{r.overtimeMinutes > 0 ? formatMinutesSummary(r.overtimeMinutes) : (r.overtimeHours > 0 ? `+${r.overtimeHours.toFixed(2)} h` : "—")}</td>
                    <td>{r.isLate ? <span className="badge badge-absent">Late</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="att-pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-page">Prev</button>
              <span>Page {page}</span>
              <button disabled={records.length < LIMIT} onClick={() => setPage((p) => p + 1)} className="btn-page">Next</button>
            </div>
          </div>
        )}
      </div>

      {showRegForm && (
        <div className="att-modal-overlay" onClick={() => setShowRegForm(false)}>
          <div className="att-modal" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header">
              <h3>Request Regularization</h3>
              <button onClick={() => setShowRegForm(false)} className="modal-close">x</button>
            </div>
            <form onSubmit={handleRegularize} className="att-form">
              <div className="form-group">
                <label>Date</label>
                <input type="date" required value={regForm.date} onChange={(e) => setRegForm({ ...regForm, date: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Punch In Time</label>
                  <input type="time" value={regForm.punchIn} onChange={(e) => setRegForm({ ...regForm, punchIn: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Punch Out Time</label>
                  <input type="time" value={regForm.punchOut} onChange={(e) => setRegForm({ ...regForm, punchOut: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Reason <span className="required">*</span></label>
                <textarea required rows={3} placeholder="Explain why this regularization is needed..." value={regForm.reason} onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })} />
              </div>
              {error && <div className="att-alert att-alert-error">{error}</div>}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRegForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={regLoading}>
                  {regLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
