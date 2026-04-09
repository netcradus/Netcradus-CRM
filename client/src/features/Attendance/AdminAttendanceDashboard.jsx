import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { 
  Users, 
  Clock, 
  AlertCircle, 
  Umbrella, 
  UserX, 
  Zap, 
  Search
} from "lucide-react";
import { API_URL } from "../../config/api";
import "./Attendance.css";

const API = API_URL;
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_BADGE = {
  present: { label: "Present", cls: "badge-present" },
  absent: { label: "Absent", cls: "badge-absent" },
  half_day: { label: "Half Day", cls: "badge-half" },
  on_leave: { label: "On Leave", cls: "badge-leave" },
  holiday: { label: "Holiday", cls: "badge-holiday" },
  weekend: { label: "Weekend", cls: "badge-weekend" },
  overtime: { label: "Overtime", cls: "badge-overtime" },
};

// ─── Live Timer Component ──────────────────────────────────────────────────
const formatMinutesSummary = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (!hrs) return `${mins}m`;
  if (!mins) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

// eslint-disable-next-line no-unused-vars
const formatBreakLog = (breaks = []) => {
  if (!breaks.length) return "—";
  return breaks
    .map((item) => {
      const start = item.breakStart ? format(parseISO(item.breakStart), "hh:mm a") : "--";
      const end = item.breakEnd ? format(parseISO(item.breakEnd), "hh:mm a") : "Live";
      return `${start}-${end} (${formatMinutesSummary(item.breakDurationMinutes || 0)})`;
    })
    .join(" | ");
};

const formatBreakLogDisplay = (breaks = []) => {
  if (!breaks.length) return "--";
  return breaks
    .map((item) => {
      const start = item.breakStart ? format(parseISO(item.breakStart), "hh:mm a") : "--";
      const end = item.breakEnd ? format(parseISO(item.breakEnd), "hh:mm a") : "Live";
      return `${start} - ${end}\n${formatMinutesSummary(item.breakDurationMinutes || 0)}`;
    })
    .join("\n\n");
};

const renderBreakLogEntries = (breaks = []) => {
  if (!breaks.length) {
    return <span className="admin-break-log-empty">--</span>;
  }

  return (
    <div className="admin-break-log-list">
      {breaks.map((item, index) => {
        const start = item.breakStart ? format(parseISO(item.breakStart), "hh:mm a") : "--";
        const end = item.breakEnd ? format(parseISO(item.breakEnd), "hh:mm a") : "Live";
        return (
          <div
            key={item._id || `${item.breakStart || "break"}-${index}`}
            className="admin-break-log-entry"
          >
            <span className="admin-break-log-time">{start} - {end}</span>
            <span className="admin-break-log-duration">{formatMinutesSummary(item.breakDurationMinutes || 0)}</span>
          </div>
        );
      })}
    </div>
  );
};

const LiveTimer = ({ startTime, totalBreakDurationMinutes = 0, currentBreakStart, isOnBreak }) => {
  const [elapsed, setElapsed] = useState("");

  const update = useCallback(() => {
    if (!startTime) return;
    const start = new Date(startTime);
    const now = new Date();
    const ongoingBreakMinutes = isOnBreak && currentBreakStart
      ? Math.max(0, (now - new Date(currentBreakStart)) / 60000)
      : 0;
    const diffMs = Math.max(0, (now - start) - ((totalBreakDurationMinutes + ongoingBreakMinutes) * 60000));
    if (diffMs < 0) { setElapsed("00:00:00"); return; }
    
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    setElapsed(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
  }, [currentBreakStart, isOnBreak, startTime, totalBreakDurationMinutes]);

  useEffect(() => {
    update();
    const inv = setInterval(update, 1000);
    return () => clearInterval(inv);
  }, [update]);

  return <span className="live-timer">{elapsed}</span>;
};

// ─── Main Admin Dashboard ──────────────────────────────────────────────────
export default function AdminAttendanceDashboard() {
  const userRole = localStorage.getItem("userRole");
  const canManagePendingActions = ["super_user", "admin", "hr"].includes(userRole);
  const [snapshot, setSnapshot] = useState(null);
  const [pending, setPending] = useState({ pendingLeaves: [], pendingRegularizations: [] });
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  
  // Filters & State
  const [filter, setFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState({}); // { id: 'approved' | 'rejected' }

  const fetchData = useCallback(async () => {
    try {
      const [snapRes, pendRes] = await Promise.all([
        axios.get(`${API}/attendance/admin/today-snapshot`, { headers: getHeaders() }),
        axios.get(`${API}/attendance/admin/pending-actions`, { headers: getHeaders() })
      ]);
      setSnapshot(snapRes.data.data);
      setPending(pendRes.data.data);
    } catch (err) {
      setError("Failed to fetch real-time data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 60000); // Poll every 60s
    return () => clearInterval(inv);
  }, [fetchData]);

  const handleAction = async (type, id, action, note = "") => {
    setProcessingId(id);
    try {
      const endpoint = type === 'leave' 
        ? `${API}/leave/${id}/${action}`
        : `${API}/attendance/regularize/${id}/${action}`;
      
      await axios.patch(endpoint, { reviewNote: note }, { headers: getHeaders() });
      
      // Visual Confirmation Flow
      setActionSuccess(prev => ({ ...prev, [id]: action }));
      
      setTimeout(() => {
        // Remove from local state after 3s
        setPending(prev => ({
          pendingLeaves: prev.pendingLeaves.filter(l => l._id !== id),
          pendingRegularizations: prev.pendingRegularizations.filter(r => r._id !== id),
        }));
        setActionSuccess(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        fetchData(); // Sync everything
      }, 3000);

    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
      setProcessingId(null);
    }
  };

  if (loading) return <div className="att-loading">Initializing Command Center...</div>;

  const departments = Array.from(new Set(snapshot?.employees?.map(e => e.department).filter(Boolean))) || [];

  const filteredEmployees = snapshot?.employees?.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || e.status === filter;
    const matchesDept = deptFilter === "all" || e.department === deptFilter;
    return matchesSearch && matchesFilter && matchesDept;
  }) || [];

  return (
    <div className="admin-att-dashboard">
      {/* Header */}
      <div className="att-header">
        <div>
          <h1 className="att-title">Team Attendance Control</h1>
          <p className="att-subtitle">Real-time workforce visibility — {format(new Date(), "PPpp")}</p>
        </div>
        <div className="live-dot-wrap">
          <span className="live-dot" /> Live Monitoring Active
        </div>
      </div>

      {/* SECTION A: Metrics Snapshot */}
      <div className="snap-metrics-grid admin-status-grid">
        <div className={`snap-card admin-status-card ${filter === 'present' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          <div className="snap-card-icon" style={{color: '#86efac'}}><Users size={20} /></div>
          <span className="snap-card-val">{snapshot?.presentCount || 0}</span>
          <span className="snap-card-lab">Present Today</span>
        </div>
        <div className="snap-card admin-status-card" onClick={() => setFilter('present')}> 
          <div className="snap-card-icon" style={{color: '#60a5fa'}}><Clock size={20} /></div>
          <span className="snap-card-val">{snapshot?.clockedInCount || 0}</span>
          <span className="snap-card-lab">Active Now</span>
        </div>
        <div className={`snap-card admin-status-card ${filter === 'late' ? 'active' : ''}`} onClick={() => setFilter('late')}>
          <div className="snap-card-icon" style={{color: '#fbbf24'}}><AlertCircle size={20} /></div>
          <span className="snap-card-val">{snapshot?.lateCount || 0}</span>
          <span className="snap-card-lab">Late Arrivals</span>
        </div>
        <div className={`snap-card admin-status-card ${filter === 'on_leave' ? 'active' : ''}`} onClick={() => setFilter('on_leave')}>
          <div className="snap-card-icon" style={{color: '#c7d2fe'}}><Umbrella size={20} /></div>
          <span className="snap-card-val">{snapshot?.onLeaveCount || 0}</span>
          <span className="snap-card-lab">On Leave</span>
        </div>
        <div className={`snap-card admin-status-card ${filter === 'absent' ? 'active' : ''}`} onClick={() => setFilter('absent')}>
          <div className="snap-card-icon" style={{color: '#fca5a5'}}><UserX size={20} /></div>
          <span className="snap-card-val">{snapshot?.absentCount || 0}</span>
          <span className="snap-card-lab">Absent</span>
        </div>
        <div className={`snap-card admin-status-card ${filter === 'overtime' ? 'active' : ''}`} onClick={() => setFilter('overtime')}>
          <div className="snap-card-icon" style={{color: '#f472b6'}}><Zap size={20} /></div>
          <span className="snap-card-val">{snapshot?.overtimeCount || 0}</span>
          <span className="snap-card-lab">Overtime</span>
        </div>
      </div>

      <div className="dashboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* SECTION B: Live Employee Table */}
        <div className="nc-panel glass-panel admin-table-panel">
          <div className="section-header-row">
            <h3 className="nc-section-title">Workforce Status</h3>
            <div className="nc-controls-left admin-table-filters">
              <div className="search-box glass-card admin-att-search">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Employee or Dept..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="nc-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="all">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="nc-select" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="on_leave">On Leave</option>
                <option value="overtime">Overtime</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>

          <div className="att-table-wrap">
            <table className="att-table admin-att-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Duration</th>
                  <th>Break Duration</th>
                  <th>Net Work</th>
                  <th>Overtime</th>
                  <th>Break Log</th>
                  <th>Late By</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.userId}>
                    <td className="emp-cell" data-label="Employee">
                      <div className="emp-avatar">{emp.name[0]}</div>
                      <div className="emp-info">
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-role">{emp.role}</div>
                      </div>
                    </td>
                    <td data-label="Department"><span className="dept-tag">{emp.department}</span></td>
                    <td data-label="Status">
                      <span 
                        className={`badge ${STATUS_BADGE[emp.status]?.cls || ""}`}
                        title={emp.status === 'on_leave' && emp.leaveDates ? `Leave: ${format(parseISO(emp.leaveDates.from), "dd MMM")} - ${format(parseISO(emp.leaveDates.to), "dd MMM")}` : ""}
                      >
                        {STATUS_BADGE[emp.status]?.label || emp.status}
                        {emp.warning === 'overworked' && (
                          <AlertCircle size={12} className="status-warning-icon" title="Exceeded standard hours by 2+ hours" />
                        )}
                      </span>
                    </td>
                    <td>{emp.punchIn ? format(parseISO(emp.punchIn), "hh:mm a") : "—"}</td>
                    <td>{emp.punchOut ? format(parseISO(emp.punchOut), "hh:mm a") : "—"}</td>
                    <td>
                      {emp.punchIn && !emp.punchOut ? (
                        <LiveTimer
                          startTime={emp.punchIn}
                          totalBreakDurationMinutes={emp.totalBreakDurationMinutes}
                          currentBreakStart={emp.currentBreakStart}
                          isOnBreak={emp.isOnBreak}
                        />
                      ) : (
                        emp.netWorkDurationMinutes > 0
                          ? formatMinutesSummary(emp.netWorkDurationMinutes)
                          : (emp.workingHours > 0 ? `${emp.workingHours.toFixed(2)}h` : "—")
                      )}
                    </td>
                    <td>{formatMinutesSummary(emp.totalBreakDurationMinutes || 0)}</td>
                    <td>{emp.netWorkDurationMinutes > 0 ? formatMinutesSummary(emp.netWorkDurationMinutes) : "—"}</td>
                    <td>{emp.overtimeMinutes > 0 ? formatMinutesSummary(emp.overtimeMinutes) : (emp.overtimeHours > 0 ? `${emp.overtimeHours.toFixed(2)}h` : "—")}</td>
                    <td className="admin-break-log-cell" title={formatBreakLogDisplay(emp.breaks)}>
                      {renderBreakLogEntries(emp.breaks)}
                    </td>
                    <td>{emp.isLate ? `${emp.lateByMinutes}m` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION C: Pending Actions Panel */}
        <div className="pending-actions-grid">
          
          {/* Leaves */}
          <div className="pending-card glass-panel">
            <h3 className="nc-section-title">Pending Leave Requests</h3>
            <div className="pending-list">
              {pending.pendingLeaves.length === 0 ? (
                <div className="empty-pending">No pending leave requests 🎉</div>
              ) : (
                pending.pendingLeaves.map(l => (
                  <div key={l._id} className="pending-item">
                    <div className="pending-info">
                      <strong>{l.userId?.name}</strong>
                      <div className="sub-text">{l.leaveTypeId?.name || "Leave"} | {format(parseISO(l.from), "MMM dd")} - {format(parseISO(l.to), "MMM dd")} ({l.totalDays || 0} days)</div>
                      <div className="reason-text">"{l.reason}"</div>
                    </div>
                    <div className="action-btns">
                      {actionSuccess[l._id] ? (
                         <span className={`action-confirmation ${actionSuccess[l._id]}`}>
                           {actionSuccess[l._id] === 'approve' ? "✓ Approved by You" : "✗ Rejected by You"}
                         </span>
                      ) : canManagePendingActions ? (
                        <>
                          <button className="btn-approve" onClick={() => handleAction('leave', l._id, 'approve')} disabled={!!processingId}>Approve</button>
                          <button className="btn-reject" onClick={() => handleAction('leave', l._id, 'reject')} disabled={!!processingId}>Reject</button>
                        </>
                      ) : (
                        <span className="action-confirmation">View only</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Regularizations */}
          <div className="pending-card glass-panel">
            <h3 className="nc-section-title">Correction Requests</h3>
            <div className="pending-list">
              {pending.pendingRegularizations.length === 0 ? (
                <div className="empty-pending">No correction requests</div>
              ) : (
                pending.pendingRegularizations.map(r => (
                  <div key={r._id} className={`pending-item ${actionSuccess[r._id] ? 'fading-out' : ''}`}>
                    <div className="pending-info">
                      <strong>{r.userId?.name}</strong>
                      <div className="sub-text">{format(parseISO(r.date), "MMM dd")} | {format(parseISO(r.requestedPunchIn), "hh:mm a")} - {format(parseISO(r.requestedPunchOut), "hh:mm a")}</div>
                      <div className="reason-text">"{r.reason}"</div>
                    </div>
                    <div className="action-btns">
                      {actionSuccess[r._id] ? (
                         <span className={`action-confirmation ${actionSuccess[r._id]}`}>
                           {actionSuccess[r._id] === 'approve' ? "✓ Approved by You" : "✗ Rejected by You"}
                         </span>
                      ) : canManagePendingActions ? (
                        <>
                          <button className="btn-approve" onClick={() => handleAction('reg', r._id, 'approve')} disabled={!!processingId}>Approve</button>
                          <button className="btn-reject" onClick={() => handleAction('reg', r._id, 'reject')} disabled={!!processingId}>Reject</button>
                        </>
                      ) : (
                        <span className="action-confirmation">View only</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
