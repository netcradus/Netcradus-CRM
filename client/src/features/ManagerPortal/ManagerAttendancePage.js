import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Clock, Search, ChevronRight } from "lucide-react";
import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_BADGE = {
  present: { label: "Present", variant: "badge-success" },
  absent: { label: "Absent", variant: "badge-error" },
  half_day: { label: "Half Day", variant: "badge-warning" },
  on_leave: { label: "On Leave", variant: "badge-info" },
  holiday: { label: "Holiday", variant: "badge-neutral" },
  weekend: { label: "Weekend", variant: "badge-neutral" },
  not_marked: { label: "Not Marked", variant: "badge-neutral" }
};

const formatTime = (isoString) => {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch (e) {
    return "—";
  }
};

const formatDuration = (seconds = 0) => {
  if (seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatLateBy = (isLate, minutes = 0) => {
  if (!isLate) return "—";
  const displayMins = Math.max(1, minutes);
  if (displayMins < 60) {
    return `${displayMins}m`;
  }
  const hrs = Math.floor(displayMins / 60);
  const mins = displayMins % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const LiveTimer = ({ startTime, totalBreakDurationMinutes = 0 }) => {
  const [elapsed, setElapsed] = useState("00:00:00");
  const update = useCallback(() => {
    if (!startTime) return;
    const now = new Date();
    const start = new Date(startTime);
    const diffSeconds = Math.max(0, Math.floor((now - start) / 1000) - (totalBreakDurationMinutes * 60));
    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    const s = diffSeconds % 60;
    setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  }, [startTime, totalBreakDurationMinutes]);

  useEffect(() => {
    update();
    const inv = setInterval(update, 1000);
    return () => clearInterval(inv);
  }, [update]);

  return <span className="timer-text" style={{ fontFamily: "monospace", fontWeight: "bold", color: "var(--color-accent)" }}>{elapsed}</span>;
};

export default function ManagerAttendancePage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { date: dateFilter };
      const { data } = await axios.get(apiUrl("/api/manager/attendance"), { headers: getHeaders(), params });
      setSummary(data.summary);
      setRecords(data.records || []);
    } catch (err) {
      setError("Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 60000);
    return () => clearInterval(inv);
  }, [fetchData]);

  const filteredRecords = records.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = e.employeeName.toLowerCase().includes(term) || 
                          e.employeeId.toLowerCase().includes(term) || 
                          e.email.toLowerCase().includes(term);
    
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "active_now") {
        matchesStatus = e.punchIn && !e.punchOut;
      } else if (statusFilter === "late") {
        matchesStatus = e.isLate;
      } else {
        matchesStatus = e.status === statusFilter;
      }
    }

    const matchesDept = deptFilter === "all" || e.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const departments = Array.from(new Set(records.map(e => e.department).filter(Boolean)));

  const handleRetry = () => {
    fetchData();
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>ManagerPortal</span><ChevronRight size={10} /><span>Attendance</span>
           </div>
           <h1 className="title">Team Attendance</h1>
           <p className="subtitle">Real-time attendance tracking and punch details for your reporting hierarchy.</p>
        </div>
        <div className="page-header-right">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontSize: '12px', fontWeight: 'var(--font-semibold)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} /> Live Monitoring Active
           </div>
        </div>
      </div>

      {error && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)' }}>{error}</p>
          <button className="btn btn-secondary" onClick={handleRetry}>Retry</button>
        </div>
      )}

      {/* Snapshot Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
           <div className="nc-stat-card" style={{ cursor: 'pointer', border: statusFilter === 'all' ? '1px solid var(--color-accent)' : '' }} onClick={() => setStatusFilter('all')}>
              <span className="metric-label">Present</span>
              <span className="metric-value" style={{ color: 'var(--color-success)' }}>{summary.present}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Today</span>
           </div>
           <div className="nc-stat-card" style={{ cursor: 'pointer', border: statusFilter === 'active_now' ? '1px solid var(--color-accent)' : '' }} onClick={() => setStatusFilter('active_now')}>
              <span className="metric-label">Active Now</span>
              <span className="metric-value" style={{ color: 'var(--color-accent)' }}>{summary.activeNow}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>On-site</span>
           </div>
           <div className="nc-stat-card" style={{ cursor: 'pointer', border: statusFilter === 'late' ? '1px solid var(--color-accent)' : '' }} onClick={() => setStatusFilter('late')}>
              <span className="metric-label">Late Arrivals</span>
              <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{summary.late}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Standard Shift</span>
           </div>
           <div className="nc-stat-card" style={{ cursor: 'pointer', border: statusFilter === 'on_leave' ? '1px solid var(--color-accent)' : '' }} onClick={() => setStatusFilter('on_leave')}>
              <span className="metric-label">On Leave</span>
              <span className="metric-value" style={{ color: 'var(--color-info)' }}>{summary.onLeave}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Approved Applications</span>
           </div>
           <div className="nc-stat-card" style={{ cursor: 'pointer', border: statusFilter === 'absent' ? '1px solid var(--color-accent)' : '' }} onClick={() => setStatusFilter('absent')}>
              <span className="metric-label">Absent</span>
              <span className="metric-value" style={{ color: 'var(--color-error)' }}>{summary.absent}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Unexcused</span>
           </div>
           <div className="nc-stat-card" style={{ cursor: 'pointer', border: statusFilter === 'not_marked' ? '1px solid var(--color-accent)' : '' }} onClick={() => setStatusFilter('not_marked')}>
              <span className="metric-label">Not Marked</span>
              <span className="metric-value" style={{ color: 'var(--color-text-muted)' }}>{summary.notMarked}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Weekend/Holiday</span>
           </div>
        </div>
      )}

      {/* Filter and search panel */}
      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
               <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
               <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search employee by name, ID, email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <input type="date" className="form-input" style={{ width: '180px' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            <select className="form-select" style={{ width: '180px' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
               <option value="all">All Departments</option>
               {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="form-select" style={{ width: '180px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
               <option value="all">All Statuses</option>
               <option value="present">Present</option>
               <option value="active_now">Active Now</option>
               <option value="late">Late Arrival</option>
               <option value="on_leave">On Leave</option>
               <option value="absent">Absent</option>
               <option value="weekend">Weekend</option>
               <option value="holiday">Holiday</option>
               <option value="not_marked">Not Marked</option>
            </select>
         </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>Loading team attendance data...</div>
      ) : (
        <div className="nc-card" style={{ overflowX: "auto" }}>
          <table className="nc-table" style={{ width: "100%", borderCollapse: "collapse" }}>
             <thead>
                <tr>
                   <th style={{ textAlign: "left" }}>Employee</th>
                   <th>Status</th>
                   <th>Punch In</th>
                   <th>Punch Out</th>
                   <th>Working Hours</th>
                   <th>Break</th>
                   <th>Overtime</th>
                   <th>Late By</th>
                </tr>
             </thead>
             <tbody>
                {filteredRecords.map(emp => (
                  <tr key={emp.userId} style={{ borderTop: "1px solid var(--color-border)" }}>
                     <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>{emp.employeeName[0]?.toUpperCase()}</div>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 'var(--font-semibold)' }}>{emp.employeeName}</span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{emp.designation} ({emp.department})</span>
                           </div>
                        </div>
                     </td>
                     <td><span className={`badge ${STATUS_BADGE[emp.status]?.variant || ''}`}>{STATUS_BADGE[emp.status]?.label || emp.status}</span></td>
                     <td>{emp.punchIn ? formatTime(emp.punchIn) : "—"}</td>
                     <td>
                        {emp.punchIn && !emp.punchOut ? (
                          <span className="badge badge-accent">Active Now</span>
                        ) : emp.punchOut ? (
                          formatTime(emp.punchOut)
                        ) : "—"}
                     </td>
                     <td>
                        {emp.punchIn && !emp.punchOut ? (
                          <LiveTimer startTime={emp.punchIn} totalBreakDurationMinutes={emp.totalBreakDurationMinutes} />
                        ) : emp.workingDurationSeconds > 0 ? (
                          formatDuration(emp.workingDurationSeconds)
                        ) : "—"}
                     </td>
                     <td>{emp.breakDurationSeconds > 0 ? formatDuration(emp.breakDurationSeconds) : "—"}</td>
                     <td>{emp.overtimeSeconds > 0 ? formatDuration(emp.overtimeSeconds) : "—"}</td>
                     <td>{formatLateBy(emp.isLate, emp.lateByMinutes)}</td>
                  </tr>
                ))}
             </tbody>
          </table>
          {filteredRecords.length === 0 && (
            <div style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-text-muted)" }}>
              {records.length === 0 ? "No reporting employees found." : "No attendance records found for the selected date."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
