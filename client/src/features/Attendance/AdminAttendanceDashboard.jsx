import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Users, Clock, AlertCircle, Umbrella, UserX, Zap, Search, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_BADGE = {
  present: { label: "Present", variant: "badge-success" },
  absent: { label: "Absent", variant: "badge-error" },
  half_day: { label: "Half Day", variant: "badge-warning" },
  on_leave: { label: "On Leave", variant: "badge-info" },
  holiday: { label: "Holiday", variant: "badge-neutral" },
  weekend: { label: "Weekend", variant: "badge-neutral" },
  overtime: { label: "Overtime", variant: "badge-accent" },
};

const formatMinutesSummary = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (!hrs) return `${mins}m`;
  if (!mins) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const LiveTimer = ({ startTime, totalBreakDurationMinutes = 0, currentBreakStart, isOnBreak }) => {
  const [elapsed, setElapsed] = useState("00:00:00");
  const update = useCallback(() => {
    if (!startTime) return;
    const now = new Date();
    const start = new Date(startTime);
    const ongoingBreakMs = isOnBreak && currentBreakStart ? Math.max(0, now - new Date(currentBreakStart)) : 0;
    const diffMs = Math.max(0, (now - start) - ((totalBreakDurationMinutes * 60000) + ongoingBreakMs));
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  }, [currentBreakStart, isOnBreak, startTime, totalBreakDurationMinutes]);

  useEffect(() => {
    update();
    const inv = setInterval(update, 1000);
    return () => clearInterval(inv);
  }, [update]);

  return <span className="timer-text">{elapsed}</span>;
};

export default function AdminAttendanceDashboard() {
  const userRole = localStorage.getItem("userRole");
  const canManageActions = ["super_user", "admin", "hr"].includes(userRole);
  const [snapshot, setSnapshot] = useState(null);
  const [pending, setPending] = useState({ pendingLeaves: [], pendingRegularizations: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [snapRes, pendRes] = await Promise.all([
        axios.get(apiUrl("/api/attendance/admin/today-snapshot"), { headers: getHeaders() }),
        axios.get(apiUrl("/api/attendance/admin/pending-actions"), { headers: getHeaders() })
      ]);
      setSnapshot(snapRes.data.data);
      setPending(pendRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 60000);
    return () => clearInterval(inv);
  }, [fetchData]);

  const handleAction = async (type, id, action) => {
    setProcessingId(id);
    try {
      const endpoint = type === 'leave' ? apiUrl(`/api/leave/${id}/${action}`) : apiUrl(`/api/attendance/regularize/${id}/${action}`);
      await axios.patch(endpoint, {}, { headers: getHeaders() });
      fetchData();
    } catch (err) { alert("Action failed"); }
    finally { setProcessingId(null); }
  };

  const filteredEmployees = snapshot?.employees?.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || e.status === filter;
    const matchesDept = deptFilter === "all" || e.department === deptFilter;
    return matchesSearch && matchesFilter && matchesDept;
  }) || [];

  if (loading) return <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>Loading Command Center...</div>;

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Attendance</span><ChevronRight size={10} /><span>Command Center</span>
           </div>
           <h1 className="title">Team Attendance</h1>
           <p className="subtitle">Real-time workforce visibility and control.</p>
        </div>
        <div className="page-header-right">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontSize: '12px', fontWeight: 'var(--font-semibold)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} /> Live Monitoring Active
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card" style={{ cursor: 'pointer', border: filter === 'all' ? '1px solid var(--color-accent)' : '' }} onClick={() => setFilter('all')}>
            <span className="metric-label">Present</span>
            <span className="metric-value" style={{ color: 'var(--color-success)' }}>{snapshot?.presentCount || 0}</span>
         </div>
         <div className="nc-stat-card" style={{ cursor: 'pointer', border: filter === 'present' ? '1px solid var(--color-accent)' : '' }} onClick={() => setFilter('present')}>
            <span className="metric-label">Active Now</span>
            <span className="metric-value" style={{ color: 'var(--color-accent)' }}>{snapshot?.clockedInCount || 0}</span>
         </div>
         <div className="nc-stat-card" style={{ cursor: 'pointer', border: filter === 'late' ? '1px solid var(--color-accent)' : '' }} onClick={() => setFilter('late')}>
            <span className="metric-label">Late Arrivals</span>
            <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{snapshot?.lateCount || 0}</span>
         </div>
         <div className="nc-stat-card" style={{ cursor: 'pointer', border: filter === 'on_leave' ? '1px solid var(--color-accent)' : '' }} onClick={() => setFilter('on_leave')}>
            <span className="metric-label">On Leave</span>
            <span className="metric-value" style={{ color: 'var(--color-info)' }}>{snapshot?.onLeaveCount || 0}</span>
         </div>
         <div className="nc-stat-card" style={{ cursor: 'pointer', border: filter === 'absent' ? '1px solid var(--color-accent)' : '' }} onClick={() => setFilter('absent')}>
            <span className="metric-label">Absent</span>
            <span className="metric-value" style={{ color: 'var(--color-error)' }}>{snapshot?.absentCount || 0}</span>
         </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
               <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
               <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search employee..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: '200px' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
               <option value="all">All Departments</option>
               {Array.from(new Set(snapshot?.employees?.map(e => e.department).filter(Boolean))).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
         <div className="nc-card">
            <table className="nc-table">
               <thead>
                  <tr>
                     <th>Employee</th>
                     <th>Status</th>
                     <th>Punch In</th>
                     <th>Duration</th>
                     <th>Break</th>
                     <th>Overtime</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.userId}>
                       <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                             <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>{emp.name[0]}</div>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 'var(--font-semibold)' }}>{emp.name}</span>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{emp.department}</span>
                             </div>
                          </div>
                       </td>
                       <td><span className={`badge ${STATUS_BADGE[emp.status]?.variant || ''}`}>{STATUS_BADGE[emp.status]?.label || emp.status}</span></td>
                       <td>{emp.punchIn ? format(parseISO(emp.punchIn), "hh:mm a") : "—"}</td>
                       <td>
                          {emp.punchIn && !emp.punchOut ? (
                            <LiveTimer startTime={emp.punchIn} totalBreakDurationMinutes={emp.totalBreakDurationMinutes} currentBreakStart={emp.currentBreakStart} isOnBreak={emp.isOnBreak} />
                          ) : emp.netWorkDurationMinutes > 0 ? formatMinutesSummary(emp.netWorkDurationMinutes) : "—"}
                       </td>
                       <td>{formatMinutesSummary(emp.totalBreakDurationMinutes || 0)}</td>
                       <td>{emp.overtimeMinutes > 0 ? formatMinutesSummary(emp.overtimeMinutes) : "—"}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="nc-card" style={{ padding: 'var(--space-4)' }}>
               <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Pending Leaves</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {pending.pendingLeaves.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No pending leaves</div>
                  ) : pending.pendingLeaves.map(l => (
                    <div key={l._id} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-base)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                          <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{l.userId?.name}</span>
                          <span className="badge badge-info">{l.totalDays} Days</span>
                       </div>
                       <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>{l.reason}</p>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-primary" style={{ flex: 1, padding: '4px', height: '32px' }} onClick={() => handleAction('leave', l._id, 'approve')}><CheckCircle2 size={14} /></button>
                          <button className="btn btn-ghost btn-danger" style={{ flex: 1, padding: '4px', height: '32px' }} onClick={() => handleAction('leave', l._id, 'reject')}><XCircle size={14} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="nc-card" style={{ padding: 'var(--space-4)' }}>
               <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Correction Requests</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {pending.pendingRegularizations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No corrections</div>
                  ) : pending.pendingRegularizations.map(r => (
                    <div key={r._id} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-base)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                          <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{r.userId?.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-accent)' }}>{format(parseISO(r.date), "dd MMM")}</span>
                       </div>
                       <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>{r.reason}</p>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-primary" style={{ flex: 1, padding: '4px', height: '32px' }} onClick={() => handleAction('reg', r._id, 'approve')}><CheckCircle2 size={14} /></button>
                          <button className="btn btn-ghost btn-danger" style={{ flex: 1, padding: '4px', height: '32px' }} onClick={() => handleAction('reg', r._id, 'reject')}><XCircle size={14} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
