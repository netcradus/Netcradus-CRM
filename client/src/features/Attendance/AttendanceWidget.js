import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Clock, LogIn, LogOut } from "lucide-react";
import "./Attendance.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_MAP = {
  present: { label: "Present", color: "#86efac" },
  absent: { label: "Absent", color: "#fca5a5" },
  half_day: { label: "Half Day", color: "#fde68a" },
  on_leave: { label: "On Leave", color: "#c7d2fe" },
  holiday: { label: "Holiday", color: "#e9d5ff" },
  weekend: { label: "Weekend", color: "#d1d5db" },
};

export default function AttendanceWidget() {
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin" || userRole === "hr"; // Access to view, but only admin is exempt
  const [today, setToday] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      if (userRole === "admin") {
        const { data } = await axios.get(`${API}/attendance/admin/today-snapshot`, { headers: getHeaders() });
        setSnapshot(data.data);
      } else {
        const { data } = await axios.get(`${API}/attendance/today`, { headers: getHeaders() });
        setToday(data.data);
      }
    } catch (e) {
      setToday(null);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePunch = async (type) => {
    if (userRole === "admin") return;
    setPunching(true); setError("");
    try {
      await axios.post(`${API}/attendance/${type}`, {}, { headers: getHeaders() });
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.message || "Action failed.");
    } finally {
      setPunching(false);
    }
  };

  if (loading) return <div className="widget-loading">Loading Attendance...</div>;

  if (userRole === "admin") {
    return (
      <div className="att-widget-card admin-summary-widget" onClick={() => window.location.href="/admin/attendance"}>
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

  const isPunchedIn = today?.punchIn && !today?.punchOut;
  const isPunchedOut = today?.punchOut;

  return (
    <div className="att-widget-card">
      <div className="widget-top">
        <div className="widget-title-area">
          <Clock size={16} className="title-icon" />
          <h4 className="widget-title">Attendance</h4>
        </div>
        {today?.status && (
          <span className="widget-status-dot" style={{ backgroundColor: STATUS_MAP[today.status]?.color }}>
            {STATUS_MAP[today.status]?.label}
          </span>
        )}
      </div>

      <div className="widget-main">
        <div className="widget-time-display">
          <div className="time-block">
            <span className="time-label">In</span>
            <span className="time-value">{today?.punchIn ? format(parseISO(today.punchIn), "hh:mm a") : "--:--"}</span>
          </div>
          <div className="time-block">
            <span className="time-label">Out</span>
            <span className="time-value">{today?.punchOut ? format(parseISO(today.punchOut), "hh:mm a") : "--:--"}</span>
          </div>
        </div>

        <div className="widget-actions">
          {!isPunchedIn && !isPunchedOut && (
            <button className="widget-btn punch-in" onClick={() => handlePunch("punch-in")} disabled={punching}>
              <LogIn size={14} /> Punch In
            </button>
          )}
          {isPunchedIn && (
            <button className="widget-btn punch-out" onClick={() => handlePunch("punch-out")} disabled={punching}>
              <LogOut size={14} /> Punch Out
            </button>
          )}
          {isPunchedOut && <div className="widget-done">Done for today! ✨</div>}
        </div>
      </div>
      {error && <div className="widget-error">{error}</div>}
    </div>
  );
}
