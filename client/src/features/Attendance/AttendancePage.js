import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Coffee, LogIn, LogOut, PlayCircle, ChevronDown, ChevronUp, Clock, History, Calendar } from "lucide-react";
import { apiUrl } from "../../config/api";

function getAuthHeaders() { return { Authorization: `Bearer ${localStorage.getItem("token")}` }; }

const formatSeconds = (s = 0) => {
  const safe = Math.max(0, Math.floor(s));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sc = safe % 60;
  return [h, m, sc].map(v => String(v).padStart(2, "0")).join(":");
};

const formatMinutesSummary = (m = 0) => {
  const safe = Math.max(0, Math.floor(m));
  const h = Math.floor(safe / 60);
  const mn = safe % 60;
  if (!h) return `${mn} min`;
  if (!mn) return `${h} hr`;
  return `${h} hr ${mn} min`;
};

export default function AttendancePage() {
  const [statusData, setStatusData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [regError, setRegError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm, setRegForm] = useState({ date: "", punchIn: "", punchOut: "", reason: "" });
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(Date.now());
  const LIMIT = 20;

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(apiUrl("/api/attendance/current-status"), { headers: getAuthHeaders() });
      setStatusData(data.data);
    } catch (e) { setStatusData(null); }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await axios.get(apiUrl(`/api/attendance/my?page=${page}&limit=${LIMIT}`), { headers: getAuthHeaders() });
      setRecords(data.data || []);
    } catch (e) { setRecords([]); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchStatus(); fetchRecords(); }, [fetchStatus, fetchRecords]);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const liveMetrics = useMemo(() => {
    if (!statusData?.record) return { workSeconds: 0, breakSeconds: 0, overtimeSeconds: 0, totalBreakMinutes: 0 };
    const r = statusData.record;
    const srvMs = statusData.serverTime ? new Date(statusData.serverTime).getTime() : Date.now();
    const dSec = Math.max(0, Math.floor((tick - srvMs) / 1000));
    const isOpen = r.punchIn && !r.punchOut;
    const isBreak = r.isOnBreak;
    const bWork = statusData.elapsedWorkSeconds || 0;
    const bBreak = statusData.ongoingBreakDurationSeconds || 0;
    const workSeconds = isOpen && !isBreak ? bWork + dSec : bWork;
    const breakSeconds = isBreak ? bBreak + dSec : 0;
    const totalBreakMinutes = (statusData.totalBreakDurationMinutes || 0) + (isBreak ? dSec / 60 : 0);
    return { workSeconds, breakSeconds, totalBreakMinutes };
  }, [statusData, tick]);

  const handleAction = async (type, body = {}) => {
    setSubmitting(true);
    try {
      await axios.post(apiUrl(`/api/attendance/${type}`), body, { headers: getAuthHeaders() });
      fetchStatus(); fetchRecords();
    } catch (e) { setError(e.response?.data?.message || "Action failed"); }
    finally { setSubmitting(false); }
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setRegError("");
    const { date, punchIn, punchOut, reason } = regForm;
    if (!date || !punchIn || !punchOut || !reason) {
      setRegError("All fields are required.");
      return;
    }
    if (punchOut <= punchIn) {
      setRegError("Punch-out time must be after punch-in time.");
      return;
    }
    const toIST = (d, t) => `${d}T${t}:00+05:30`;
    setSubmitting(true);
    try {
      await axios.post(
        apiUrl("/api/attendance/regularize"),
        {
          date,
          requestedPunchIn: toIST(date, punchIn),
          requestedPunchOut: toIST(date, punchOut),
          reason,
        },
        { headers: getAuthHeaders() }
      );
      setShowRegForm(false);
      setRegForm({ date: "", punchIn: "", punchOut: "", reason: "" });
      setSuccess("Regularization request submitted successfully.");
    } catch (err) {
      setRegError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPunchedIn = statusData?.record?.punchIn && !statusData?.record?.punchOut;
  const isOnBreak = statusData?.record?.isOnBreak;

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Daily Attendance</h1>
          <p className="subtitle">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => setShowRegForm(true)}>Regularize</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Work Duration</span>
          <span className="metric-value" style={{ color: liveMetrics.workSeconds >= 28800 ? 'var(--color-success)' : 'inherit' }}>
            {formatSeconds(liveMetrics.workSeconds)}
          </span>
          <span className="metric-trend">Shift Target: 08:00:00</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Break Duration</span>
          <span className="metric-value" style={{ color: isOnBreak ? 'var(--color-warning)' : 'inherit' }}>
            {formatSeconds(isOnBreak ? liveMetrics.breakSeconds : liveMetrics.totalBreakMinutes * 60)}
          </span>
          <span className="metric-trend">{isOnBreak ? 'Active Break' : 'Total Taken'}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Current Status</span>
          <span className="metric-value" style={{ fontSize: 'var(--text-lg)' }}>
             {isOnBreak ? "On Break" : isPunchedIn ? "Punched In" : statusData?.record?.punchOut ? "Shift Done" : "Not In"}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Control Center</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {!isPunchedIn && !statusData?.record?.punchOut ? (
              <button className="btn btn-primary" style={{ height: '56px', fontSize: 'var(--text-lg)' }} onClick={() => handleAction('punch-in')}>
                <LogIn size={20} /> Punch In
              </button>
            ) : isPunchedIn ? (
              <button className="btn btn-primary" style={{ height: '56px', fontSize: 'var(--text-lg)', background: 'var(--color-error)' }} onClick={() => handleAction('punch-out')}>
                <LogOut size={20} /> Punch Out
              </button>
            ) : (
              <div className="badge badge-success" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>Work Day Completed</div>
            )}

            {isPunchedIn && (
              <button className={`btn btn-ghost`} style={{ height: '48px', border: '1px solid var(--color-border)' }} onClick={() => handleAction(isOnBreak ? 'break-end' : 'break-start', { breakType: 'lunch' })}>
                {isOnBreak ? <><PlayCircle size={18} /> End Break</> : <><Coffee size={18} /> Start Lunch Break</>}
              </button>
            )}
            
            <div style={{ marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Punch In:</span>
                <span style={{ fontWeight: 'var(--font-semibold)' }}>{statusData?.record?.punchIn ? formatInTimeZone(parseISO(statusData.record.punchIn), "Asia/Kolkata", "hh:mm a") : "--:--"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Punch Out:</span>
                <span style={{ fontWeight: 'var(--font-semibold)' }}>{statusData?.record?.punchOut ? formatInTimeZone(parseISO(statusData.record.punchOut), "Asia/Kolkata", "hh:mm a") : "--:--"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Attendance History</h3>
          <table className="nc-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>In</th>
                <th>Out</th>
                <th>Net Work</th>
                <th>Break</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r._id || idx}>
                  <td>{r.shiftDate ? formatInTimeZone(parseISO(r.shiftDate), "Asia/Kolkata", "dd MMM") : "--"}</td>
                  <td><span className={`badge badge-${r.status === 'present' ? 'success' : r.status === 'absent' ? 'error' : 'warning'}`}>{r.status}</span></td>
                  <td>{r.punchIn ? formatInTimeZone(parseISO(r.punchIn), "Asia/Kolkata", "hh:mm a") : "--"}</td>
                  <td>{r.punchOut ? formatInTimeZone(parseISO(r.punchOut), "Asia/Kolkata", "hh:mm a") : "--"}</td>
                  <td>{formatMinutesSummary(r.netWorkDurationMinutes || 0)}</td>
                  <td>{formatMinutesSummary(r.totalBreakDurationMinutes || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {showRegForm && (
        <div className="nc-modal-overlay" onClick={() => setShowRegForm(false)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
             <div className="nc-modal-header"><h3>Regularization</h3></div>
             <form onSubmit={handleRegSubmit} className="form">
                <div className="form-field">
                   <label className="form-label">Date</label>
                   <input className="form-input" type="date" required value={regForm.date} onChange={e => setRegForm({...regForm, date: e.target.value})} />
                </div>
                <div className="form-field">
                   <label className="form-label">Punch-In Time</label>
                   <input className="form-input" type="time" required value={regForm.punchIn} onChange={e => setRegForm({...regForm, punchIn: e.target.value})} />
                </div>
                <div className="form-field">
                   <label className="form-label">Punch-Out Time</label>
                   <input className="form-input" type="time" required value={regForm.punchOut} onChange={e => setRegForm({...regForm, punchOut: e.target.value})} />
                </div>
                <div className="form-field">
                   <label className="form-label">Reason</label>
                   <textarea className="form-input" rows={3} required value={regForm.reason} onChange={e => setRegForm({...regForm, reason: e.target.value})} />
                </div>
                {regError && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', margin: '0' }}>{regError}</p>}
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>Submit</button>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowRegForm(false)}>Cancel</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
