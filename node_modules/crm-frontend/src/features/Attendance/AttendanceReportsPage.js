import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Download, Search, FileText, ChevronRight, Filter } from "lucide-react";
import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const userRoleRaw = localStorage.getItem("userRole") || "";
const userRole = userRoleRaw.toLowerCase().replace(/[- ]/g, "_");
const userId = localStorage.getItem("userId");
const isHRAdmin = ["super_user", "hr", "coo"].includes(userRole);

export default function AttendanceReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [targetUserId, setTarget] = useState(isHRAdmin ? "" : (userId || ""));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    if (!isHRAdmin) return;
    setLoadingUsers(true);
    setUsersError("");
    axios.get(apiUrl("/api/auth/users"), { headers: getHeaders() })
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        setUsers(list);
      })
      .catch((err) => {
        console.error("Failed to load employees list:", err);
        setUsersError("Unable to load employees.");
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, []);

  const fetchReport = useCallback(async () => {
    const uid = isHRAdmin ? targetUserId : userId;
    if (!uid) return;
    setLoading(true); setError("");
    setReport(null); // Prevent stale report data from remaining visible
    try {
      const { data } = await axios.get(apiUrl(`/api/attendance/report/monthly?userId=${uid}&month=${month}&year=${year}`), { headers: getHeaders() });
      setReport(data.data);
    } catch (e) { 
      const errMsg = e.response?.data?.message || "Failed to fetch report.";
      setError(errMsg); 
    }
    finally { setLoading(false); }
  }, [month, year, targetUserId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    if (!report) return;
    setExporting(true);
    setError("");
    try {
      const uid = isHRAdmin ? targetUserId : userId;
      const response = await axios.get(apiUrl(`/api/attendance/report/export?userId=${uid}&month=${month}&year=${year}`), { headers: getHeaders(), responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${month}_${year}.csv`);
      link.click();
    } catch (e) { 
      const errMsg = e.response?.data?.message || "Export failed.";
      setError(errMsg); 
    }
    finally { setExporting(false); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Attendance</span><ChevronRight size={10} /><span>Reports</span>
           </div>
           <h1 className="title">Attendance Reports</h1>
           <p className="subtitle">Monthly performance and metrics analysis.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-ghost" onClick={handleExport} disabled={exporting || !report}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {isHRAdmin && (
              <div className="form-field" style={{ flex: 1, minWidth: '200px' }}>
                 <label className="form-label">Employee</label>
                 {loadingUsers ? (
                   <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '8px 0' }}>Loading employees...</div>
                 ) : usersError ? (
                   <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', padding: '8px 0' }}>{usersError}</div>
                 ) : users.length === 0 ? (
                   <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', padding: '8px 0' }}>No active employees found.</div>
                 ) : (
                   <select 
                     className="form-select" 
                     value={targetUserId} 
                     onChange={e => {
                       setTarget(e.target.value);
                       setReport(null);
                       setError("");
                     }}
                   >
                      <option value="">Select Employee</option>
                      {users
                        .filter(u => u.isDisabled !== true && u.role !== 'partner')
                        .map(u => {
                          const idText = u.userId ? ` — ${u.userId}` : "";
                          const deptText = u.department ? ` — ${u.department}` : "";
                          return (
                            <option key={u._id} value={u._id}>
                              {u.name || u.email}{idText}{deptText}
                            </option>
                          );
                        })}
                   </select>
                 )}
              </div>
            )}
            <div className="form-field" style={{ width: '160px' }}>
               <label className="form-label">Month</label>
               <select 
                 className="form-select" 
                 value={month} 
                 onChange={e => {
                   setMonth(Number(e.target.value));
                   setReport(null);
                   setError("");
                 }}
               >
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
               </select>
            </div>
            <div className="form-field" style={{ width: '120px' }}>
               <label className="form-label">Year</label>
               <select 
                 className="form-select" 
                 value={year} 
                 onChange={e => {
                   setYear(Number(e.target.value));
                   setReport(null);
                   setError("");
                 }}
               >
                  {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
               <button 
                 className="btn btn-primary" 
                 onClick={fetchReport} 
                 disabled={loading || (isHRAdmin && !targetUserId)} 
                 style={{ height: '36px' }}
               >
                 {loading ? "Generating..." : "Generate"}
               </button>
            </div>
         </div>
      </div>

      {error && (
        <div className="nc-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', border: '1px solid var(--color-error)', background: 'rgba(239, 68, 68, 0.05)' }}>
           <p style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p>
        </div>
      )}

      {report ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
             <div className="nc-stat-card"><span className="metric-label">Working Days</span><span className="metric-value">{report.totalWorkingDays ?? 0}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Present</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{report.present ?? 0}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Absent</span><span className="metric-value" style={{ color: 'var(--color-error)' }}>{report.absent ?? 0}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Late Arrivals</span><span className="metric-value" style={{ color: 'var(--color-warning)' }}>{report.lateCount ?? 0}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Total Hours</span><span className="metric-value">{report.totalHoursWorked ?? 0} h</span></div>
          </div>

          <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
             <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)', margin: 0 }}>Employee Summary</h3>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Employee Name:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.user?.name || "—"}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Employee ID:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.user?.employeeId || "—"}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Department:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.user?.department || "—"}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Designation:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.user?.designation || "—"}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Selected Month & Year:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1]} {year}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Working Days:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.totalWorkingDays ?? 0}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Present Days:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.present ?? 0}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Absent Days:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.absent ?? 0}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Leave Days:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.onLeave ?? 0}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Late Arrivals:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.lateCount ?? 0}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Total Working Hours:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{report.totalHoursWorked ?? 0} h</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Total Overtime:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{formatMins(report.totalOvertimeMinutes)}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Attendance Percentage:</span> <strong style={{ color: 'var(--color-accent)' }}>{report.attendancePercentage ?? 0}%</strong></div>
             </div>
          </div>

          <div className="nc-card" style={{ overflowX: "auto" }}>
             <table className="nc-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                   <tr>
                     <th style={{ textAlign: "left" }}>Date</th>
                     <th>Day</th>
                     <th>Status</th>
                     <th>Punch In</th>
                     <th>Punch Out</th>
                     <th>Working Hours</th>
                     <th>Break</th>
                     <th>Overtime</th>
                     <th>Late By</th>
                     <th>Leave Type</th>
                     <th>Remarks</th>
                   </tr>
                </thead>
                <tbody>
                   {report.records?.map((r, i) => {
                     const cleanStr = r.shiftDate ? (r.shiftDate.includes('T') ? r.shiftDate.split('T')[0] : r.shiftDate) : "";
                     let dateDisplay = "—";
                     let weekday = "—";
                     if (cleanStr) {
                       const [y, m, d] = cleanStr.split('-').map(Number);
                       const dateNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                       const dName = dateNames[m - 1] || "";
                       dateDisplay = `${String(d).padStart(2, '0')} ${dName}`;
                       try {
                         weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
                       } catch (err) {}
                     }

                     const statusLabel = r.status ? r.status.replace('_', ' ') : '—';
                     const badgeClass = r.status === 'present' || r.status === 'overtime' ? 'badge-success' : 
                                        r.status === 'half_day' ? 'badge-warning' :
                                        r.status === 'absent' ? 'badge-error' : 
                                        r.status === 'on_leave' ? 'badge-info' : 'badge-neutral';

                     return (
                       <tr key={i} style={{ borderTop: "1px solid var(--color-border)", opacity: r.status === 'absent' ? 0.7 : 1 }}>
                          <td style={{ fontWeight: 'var(--font-semibold)', textAlign: "left" }}>{dateDisplay}</td>
                          <td>{weekday}</td>
                          <td><span className={`badge ${badgeClass}`}>{statusLabel}</span></td>
                          <td>{formatTime12h(r.punchIn)}</td>
                          <td>{formatTime12h(r.punchOut)}</td>
                          <td>{r.workingHours ? `${r.workingHours}h` : "—"}</td>
                          <td>{r.totalBreakDurationMinutes !== undefined && r.totalBreakDurationMinutes !== null ? `${r.totalBreakDurationMinutes}m` : "0m"}</td>
                          <td>{r.overtimeMinutes > 0 ? formatMins(r.overtimeMinutes) : "—"}</td>
                          <td>{formatLateBy(r.isLate, r.lateByMinutes)}</td>
                          <td>{r.leaveType || "—"}</td>
                          <td>{r.remark || "—"}</td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
             {(!report.records || report.records.length === 0) && (
               <div style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-text-muted)" }}>
                 No records found for the selected filters.
               </div>
             )}
          </div>
        </>
      ) : (
        <div className="nc-card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
           <FileText size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
           <p>{isHRAdmin && !targetUserId ? "Select an employee to generate the attendance report." : "Select filters and click Generate to view report."}</p>
        </div>
      )}
    </div>
  );
}

function formatTime12h(isoString) {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = String(minutes).padStart(2, '0');
    return `${String(hours).padStart(2, '0')}:${strMinutes} ${ampm}`;
  } catch (e) {
    return "—";
  }
}

const formatLateBy = (isLate, minutes = 0) => {
  if (!isLate || minutes <= 0) return "—";
  const displayMins = Math.max(1, minutes);
  if (displayMins < 60) {
    return `${displayMins}m`;
  }
  const hrs = Math.floor(displayMins / 60);
  const mins = displayMins % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const formatMins = (minutes = 0) => {
  if (!minutes || minutes <= 0) return "—";
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (!hrs) return `${mins}m`;
  if (!mins) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};
