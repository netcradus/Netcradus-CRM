import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Download, Search, FileText, ChevronRight, Filter } from "lucide-react";
import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const userRole = localStorage.getItem("userRole");
const userId = localStorage.getItem("userId");
const isHRAdmin = ["super_user", "hr"].includes(userRole);

export default function AttendanceReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [targetUserId, setTarget] = useState(userId || "");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!isHRAdmin) return;
    axios.get(apiUrl("/api/auth/users"), { headers: getHeaders() })
      .then(r => setUsers(r.data.data || []))
      .catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    const uid = isHRAdmin ? targetUserId : userId;
    if (!uid) return;
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(apiUrl(`/api/attendance/report/monthly?userId=${uid}&month=${month}&year=${year}`), { headers: getHeaders() });
      setReport(data.data);
    } catch (e) { setError("Failed to fetch report."); }
    finally { setLoading(false); }
  }, [month, year, targetUserId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const uid = isHRAdmin ? targetUserId : userId;
      const response = await axios.get(apiUrl(`/api/attendance/report/export?userId=${uid}&month=${month}&year=${year}`), { headers: getHeaders(), responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${month}_${year}.csv`);
      link.click();
    } catch (e) { setError("Export failed."); }
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
                 <select className="form-select" value={targetUserId} onChange={e => setTarget(e.target.value)}>
                    <option value={userId}>My Report</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                 </select>
              </div>
            )}
            <div className="form-field" style={{ width: '160px' }}>
               <label className="form-label">Month</label>
               <select className="form-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
               </select>
            </div>
            <div className="form-field" style={{ width: '120px' }}>
               <label className="form-label">Year</label>
               <select className="form-select" value={year} onChange={e => setYear(Number(e.target.value))}>
                  {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
               <button className="btn btn-primary" onClick={fetchReport} disabled={loading} style={{ height: '36px' }}>Generate</button>
            </div>
         </div>
      </div>

      {report ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
             <div className="nc-stat-card"><span className="metric-label">Working Days</span><span className="metric-value">{report.totalWorkingDays}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Present</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{report.present}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Absent</span><span className="metric-value" style={{ color: 'var(--color-error)' }}>{report.absent}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Late Arrivals</span><span className="metric-value" style={{ color: 'var(--color-warning)' }}>{report.lateCount}</span></div>
             <div className="nc-stat-card"><span className="metric-label">Total Hours</span><span className="metric-value">{report.totalHoursWorked || 0} h</span></div>
          </div>

          <div className="nc-card">
             <table className="nc-table">
                <thead>
                   <tr><th>Date</th><th>Day</th><th>Status</th><th>In</th><th>Out</th><th>Work</th><th>Break</th><th>Late</th></tr>
                </thead>
                <tbody>
                   {report.records?.map((r, i) => {
                     const d = r.shiftDate ? new Date(r.shiftDate) : null;
                     return (
                       <tr key={i} style={{ opacity: r.status === 'absent' ? 0.7 : 1 }}>
                          <td style={{ fontWeight: 'var(--font-semibold)' }}>{d ? d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }) : "—"}</td>
                          <td>{d ? d.toLocaleDateString("en-GB", { weekday: 'short' }) : "—"}</td>
                          <td><span className={`badge ${r.status === 'present' ? 'badge-success' : r.status === 'absent' ? 'badge-error' : 'badge-neutral'}`}>{r.status?.replace("_"," ")}</span></td>
                          <td>{r.punchIn ? format(new Date(r.punchIn), "hh:mm a") : "—"}</td>
                          <td>{r.punchOut ? format(new Date(r.punchOut), "hh:mm a") : "—"}</td>
                          <td>{r.netWorkDurationMinutes ? `${(r.netWorkDurationMinutes / 60).toFixed(2)}h` : "—"}</td>
                          <td>{r.totalBreakDurationMinutes}m</td>
                          <td>{r.isLate ? <span style={{ color: 'var(--color-error)' }}>Late</span> : "—"}</td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>
        </>
      ) : (
        <div className="nc-card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
           <FileText size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
           <p>Select filters and click Generate to view report.</p>
        </div>
      )}
    </div>
  );
}

function format(date, fmt) {
   // Minimal internal formatter for this component to avoid external dependency issues
   return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
