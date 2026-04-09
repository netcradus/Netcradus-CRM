import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../../config/api";
import "./Attendance.css";

const API = API_URL;
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const userRole  = localStorage.getItem("userRole");
const userId    = localStorage.getItem("userId");
const isHRAdmin = ["super_user", "hr"].includes(userRole);

const now = new Date();

export default function AttendanceReportsPage() {
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [year, setYear]           = useState(now.getFullYear());
  const [targetUserId, setTarget] = useState(userId || "");
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [exporting, setExporting] = useState(false);
  const [users, setUsers]         = useState([]);

  // Fetch user list for HR/Admin select
  useEffect(() => {
    if (!isHRAdmin) return;
    axios.get(`${API}/auth/users`, { headers: getHeaders() })
      .then(r => setUsers(r.data.data || r.data || []))
      .catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    const uid = isHRAdmin ? targetUserId : userId;
    if (!uid) return;
    
    setLoading(true); setError(""); setReport(null);
    try {
      const { data } = await axios.get(
        `${API}/attendance/report/monthly?userId=${uid}&month=${month}&year=${year}`,
        { headers: getHeaders() }
      );
      setReport(data.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch report.");
    } finally {
      setLoading(false);
    }
  }, [month, year, targetUserId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const uid = isHRAdmin ? targetUserId : userId;
      const response = await axios.get(
        `${API}/attendance/report/export?userId=${uid}&month=${month}&year=${year}`,
        { headers: getHeaders(), responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const StatCard = ({ label, value, cls }) => (
    <div className={`stat-card ${cls || ""}`}>
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
    </div>
  );

  return (
    <div className="att-page">
      <div className="att-header">
        <div>
          <h1 className="att-title">Attendance Reports</h1>
          <p className="att-subtitle">Monthly summary &amp; export</p>
        </div>
        <button className="btn-secondary" onClick={handleExport} disabled={exporting || !report}>
          {exporting ? "Exporting…" : "⬇ Export CSV"}
        </button>
      </div>

      {error && <div className="att-alert att-alert-error">{error}</div>}

      {/* Filters */}
      <div className="report-filters">
        {isHRAdmin && (
          <div className="filter-group">
            <label>Employee</label>
            <select value={targetUserId} onChange={e => setTarget(e.target.value)}>
              <option value={userId}>My Report</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name || u.email}</option>
              ))}
            </select>
          </div>
        )}
        <div className="filter-group">
          <label>Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={fetchReport} disabled={loading}>
          {loading ? "Loading…" : "Generate"}
        </button>
      </div>

      {/* Stats */}
      {report ? (
        <>
          <div className="stat-grid">
            <StatCard label="Total Working Days" value={report.totalWorkingDays} cls="stat-neutral" />
            <StatCard label="Present"            value={report.present}          cls="stat-success" />
            <StatCard label="Absent"             value={report.absent}           cls="stat-danger" />
            <StatCard label="Half Day"           value={report.halfDay}          cls="stat-warn" />
            <StatCard label="On Leave"           value={report.onLeave}          cls="stat-info" />
            <StatCard label="Holidays"           value={report.holidays}         cls="stat-neutral" />
            <StatCard label="Late Arrivals"      value={report.lateCount}        cls="stat-warn" />
            <StatCard label="Early Departures"   value={report.earlyDepartureCount} cls="stat-warn" />
            <StatCard label="Total Hours"        value={report.totalHoursWorked != null ? `${report.totalHoursWorked} h` : "—"} cls="stat-success" />
            <StatCard label="Overtime"           value={report.totalOvertime > 0 ? `+${report.totalOvertime} h` : "—"} cls="stat-info" />
          </div>

          {/* Attendance records table */}
          {report.records?.length > 0 && (
            <div className="att-section">
              <h2 className="att-section-title">Daily Breakdown</h2>
              <div className="att-table-wrap">
                <table className="att-table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Day</th><th>Status</th>
                      <th>Punch In</th><th>Punch Out</th><th>Break Duration</th><th>Net Work</th><th>OT</th><th>Late</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.records.map((r, i) => {
                      const d = r.shiftDate ? new Date(r.shiftDate) : null;
                      const STATUS = {
                        present:"badge-present", absent:"badge-absent",
                        half_day:"badge-half", on_leave:"badge-leave",
                        holiday:"badge-holiday", weekend:"badge-weekend"
                      };
                      return (
                        <tr key={i}>
                          <td>{d ? d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}</td>
                          <td>{d ? d.toLocaleDateString("en-IN", { weekday: "short" }) : "—"}</td>
                          <td><span className={`badge ${STATUS[r.status] || ""}`}>{r.status?.replace("_"," ")}</span></td>
                          <td>{r.punchIn  ? new Date(r.punchIn).toLocaleTimeString("en-IN",  { hour:"2-digit", minute:"2-digit" }) : "—"}</td>
                          <td>{r.punchOut ? new Date(r.punchOut).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }) : "—"}</td>
                          <td>{r.totalBreakDurationMinutes != null ? `${r.totalBreakDurationMinutes} min` : "—"}</td>
                          <td>{r.netWorkDurationMinutes != null ? `${(r.netWorkDurationMinutes / 60).toFixed(2)} h` : (r.workingHours != null ? `${r.workingHours.toFixed(2)} h` : "—")}</td>
                          <td>{r.overtimeMinutes > 0 ? `+${(r.overtimeMinutes / 60).toFixed(2)} h` : (r.overtimeHours > 0 ? `+${r.overtimeHours.toFixed(2)} h` : "—")}</td>
                          <td>{r.isLate ? <span className="badge badge-absent">Late</span> : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : !loading && (
        <div className="att-empty">Select filters and click Generate to view your report.</div>
      )}
      {loading && <div className="att-loading">Generating report…</div>}
    </div>
  );
}
