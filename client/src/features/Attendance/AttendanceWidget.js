import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Clock, Coffee, LogIn, LogOut, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";
import { API_URL } from "../../config/api";
import "./Attendance.css";

const API = API_URL;
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_MAP = {
  present: { label: "Present", color: "#86efac" },
  absent: { label: "Absent", color: "#fca5a5" },
  half_day: { label: "Half Day", color: "#fde68a" },
  on_leave: { label: "On Leave", color: "#c7d2fe" },
  holiday: { label: "Holiday", color: "#e9d5ff" },
  weekend: { label: "Weekend", color: "#d1d5db" },
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

function BreakLog({ breaks, expanded, onToggle }) {
  return (
    <div className="widget-break-log">
      <button type="button" className="widget-break-toggle" onClick={onToggle}>
        <span>Breaks Log</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="widget-break-list">
          {breaks.length ? breaks.map((item) => (
            <div key={item._id || `${item.breakStart}-${item.breakType}`} className="widget-break-item">
              <div>
                <strong>{item.breakType ? item.breakType.replace("_", " ") : "Break"}</strong>
                <span>
                  {item.breakStart ? format(parseISO(item.breakStart), "hh:mm a") : "--"}
                  {" - "}
                  {item.breakEnd ? format(parseISO(item.breakEnd), "hh:mm a") : "In progress"}
                </span>
              </div>
              <em>{formatMinutesSummary(item.breakDurationMinutes || 0)}</em>
            </div>
          )) : <p className="tasks-empty-inline">No breaks recorded yet.</p>}
        </div>
      )}
    </div>
  );
}

export default function AttendanceWidget() {
  const userRole = localStorage.getItem("userRole");
  const isAdminSummary = ["super_user", "admin"].includes(userRole);
  const [snapshot, setSnapshot] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedBreakType, setSelectedBreakType] = useState("lunch");
  const [showBreakLog, setShowBreakLog] = useState(false);
  const [tick, setTick] = useState(Date.now());

  const fetchData = useCallback(async () => {
    try {
      if (isAdminSummary) {
        const { data } = await axios.get(`${API}/attendance/admin/today-snapshot`, { headers: getHeaders() });
        setSnapshot(data.data);
      } else {
        const { data } = await axios.get(`${API}/attendance/current-status`, { headers: getHeaders() });
        setStatusData(data.data);
      }
    } catch (e) {
      setSnapshot(null);
      setStatusData(null);
      setError(e.response?.data?.message || "");
    } finally {
      setLoading(false);
    }
  }, [isAdminSummary]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (endpoint, body = {}, fallbackMessage = "Action completed.") => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post(`${API}/attendance/${endpoint}`, body, { headers: getHeaders() });
      setSuccess(data.message || fallbackMessage);
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.message || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const liveMetrics = useMemo(() => {
    if (!statusData?.record) {
      return {
        workSeconds: 0,
        breakSeconds: 0,
        overtimeSeconds: 0,
        totalBreakMinutes: 0,
      };
    }

    const record = statusData.record;
    const baseWorkSeconds = statusData.elapsedWorkSeconds || 0;
    const baseBreakSeconds = statusData.ongoingBreakDurationSeconds || 0;
    const serverTimeMs = statusData.serverTime ? new Date(statusData.serverTime).getTime() : Date.now();
    const deltaSeconds = Math.max(0, Math.floor((tick - serverTimeMs) / 1000));

    const isOpenShift = record.punchIn && !record.punchOut;
    const isOnBreak = record.isOnBreak;

    const workSeconds = isOpenShift && !isOnBreak ? baseWorkSeconds + deltaSeconds : baseWorkSeconds;
    const breakSeconds = isOnBreak ? baseBreakSeconds + deltaSeconds : 0;
    const totalBreakMinutes = (statusData.totalBreakDurationMinutes || 0) + (isOnBreak ? deltaSeconds / 60 : 0);
    const overtimeSeconds = Math.max(0, workSeconds - (8 * 60 * 60));

    return { workSeconds, breakSeconds, overtimeSeconds, totalBreakMinutes };
  }, [statusData, tick]);

  if (loading) return <div className="widget-loading">Loading Attendance...</div>;

  if (isAdminSummary) {
    return (
      <div className="att-widget-card admin-summary-widget" onClick={() => window.location.href = "/admin/attendance"}>
        <div className="widget-top">
          <div className="widget-title-area">
            <Clock size={16} className="title-icon" />
            <h4 className="widget-title">Team Attendance</h4>
          </div>
          <span className="live-pill">LIVE</span>
        </div>
        <div className="widget-snapshot-grid">
          <div className="snap-item">
            <span className="snap-val">{snapshot?.presentCount || 0}</span>
            <span className="snap-lab">Present</span>
          </div>
          <div className="snap-item">
            <span className="snap-val">{snapshot?.onLeaveCount || 0}</span>
            <span className="snap-lab">On Leave</span>
          </div>
          <div className="snap-item">
            <span className="snap-val">{snapshot?.lateCount || 0}</span>
            <span className="snap-lab">Late</span>
          </div>
          <div className="snap-item">
            <span className="snap-val">{snapshot?.absentCount || 0}</span>
            <span className="snap-lab">Absent</span>
          </div>
        </div>
      </div>
    );
  }

  const record = statusData?.record;
  const breaks = statusData?.breaks || [];
  const isPunchedIn = record?.punchIn && !record?.punchOut;
  const isPunchedOut = Boolean(record?.punchOut);
  const isOnBreak = Boolean(record?.isOnBreak);
  const workComplete = liveMetrics.workSeconds >= (8 * 60 * 60);

  return (
    <div className="att-widget-card">
      <div className="widget-top">
        <div className="widget-title-area">
          <Clock size={16} className="title-icon" />
          <h4 className="widget-title">Attendance</h4>
        </div>
        {record?.status && (
          <span className="widget-status-dot" style={{ backgroundColor: STATUS_MAP[record.status]?.color }}>
            {STATUS_MAP[record.status]?.label}
          </span>
        )}
      </div>

      <div className="widget-main">
        <div className="widget-metric-block">
          <span className="time-label">Work Timer</span>
          <span className={`widget-primary-time ${workComplete ? "widget-primary-time--done" : ""}`}>
            {formatSeconds(liveMetrics.workSeconds)}
          </span>
          {workComplete && <span className="widget-helper-text">8 hrs complete</span>}
        </div>

        {isOnBreak && (
          <div className="widget-metric-block widget-metric-block--break">
            <span className="time-label">Break Timer</span>
            <span className="widget-primary-time widget-primary-time--break">
              {formatSeconds(liveMetrics.breakSeconds)}
            </span>
            <span className="widget-helper-text">Work timer paused</span>
          </div>
        )}

        <div className="widget-time-display">
          <div className="time-block">
            <span className="time-label">Punch In</span>
            <span className="time-value">{record?.punchIn ? format(parseISO(record.punchIn), "hh:mm a") : "--:--"}</span>
          </div>
          <div className="time-block">
            <span className="time-label">Punch Out</span>
            <span className="time-value">{record?.punchOut ? format(parseISO(record.punchOut), "hh:mm a") : "--:--"}</span>
          </div>
        </div>

        {isPunchedIn && !isPunchedOut && (
          <div className="widget-break-controls">
            {!isOnBreak && (
              <select
                className="nc-select widget-break-select"
                value={selectedBreakType}
                onChange={(e) => setSelectedBreakType(e.target.value)}
              >
                {BREAK_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            )}
            {!isOnBreak ? (
              <button className="widget-btn widget-btn--secondary" onClick={() => handleAction("break-start", { breakType: selectedBreakType }, "Break started.")} disabled={submitting}>
                <Coffee size={14} /> Start Break
              </button>
            ) : (
              <button className="widget-btn widget-btn--warning" onClick={() => handleAction("break-end", {}, "Break ended.")} disabled={submitting}>
                <PlayCircle size={14} /> End Break
              </button>
            )}
          </div>
        )}

        <div className="widget-stats-grid">
          <div className="widget-stat-item">
            <span>Total Break</span>
            <strong>{formatMinutesSummary(liveMetrics.totalBreakMinutes)}</strong>
          </div>
          <div className="widget-stat-item">
            <span>Overtime</span>
            <strong>{liveMetrics.overtimeSeconds > 0 ? formatMinutesSummary(liveMetrics.overtimeSeconds / 60) : "No overtime"}</strong>
          </div>
        </div>

        <div className="widget-actions">
          {!isPunchedIn && !isPunchedOut && (
            <button className="widget-btn punch-in" onClick={() => handleAction("punch-in", {}, "Punched in successfully.")} disabled={submitting}>
              <LogIn size={14} /> Punch In
            </button>
          )}
          {isPunchedIn && (
            <button className="widget-btn punch-out" onClick={() => handleAction("punch-out", {}, "Punched out successfully.")} disabled={submitting}>
              <LogOut size={14} /> Punch Out
            </button>
          )}
          {isPunchedOut && <div className="widget-done">Net work {formatMinutesSummary(record?.netWorkDurationMinutes || 0)}</div>}
        </div>

        <BreakLog breaks={breaks} expanded={showBreakLog} onToggle={() => setShowBreakLog((value) => !value)} />
      </div>

      {success && <div className="widget-success">{success}</div>}
      {error && <div className="widget-error">{error}</div>}
    </div>
  );
}
