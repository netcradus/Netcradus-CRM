import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  CircleUserRound,
  Users,
  BriefcaseBusiness,
  ArrowRightLeft,
  PlaneTakeoff,
  ArrowRight,
  Clock3,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import "./HRDashboard.css";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/api";

const leaveRequests = [
  {
    id: 1,
    photo: "SJ",
    name: "Sarah Jenkins",
    dept: "HR",
    requestDate: "09/10/2023",
    leaveType: "Leave Type",
    dates: "Dec 10 - Dec 25",
    status: "Approved",
  },
  {
    id: 2,
    photo: "SJ",
    name: "Sarah Jenkins",
    dept: "Engineer",
    requestDate: "09/01/2023",
    leaveType: "Leave Typicit",
    dates: "Dec 18 - Dec 26",
    status: "Pending",
  },
  {
    id: 3,
    photo: "SJ",
    name: "Sarah Jenkins",
    dept: "Dept.",
    requestDate: "09/01/2023",
    leaveType: "Leave Type",
    dates: "Dec 18 - Dec 23",
    status: "Rejected",
  },
];

const anniversaries = [
  { name: "Sarah Jenkins", date: "06/10/2023", dept: "Sales" },
  { name: "Sarah Jenkins", date: "06/10/2023", dept: "Depts" },
];

const quickTasks = [
  { icon: "Checklist", text: "Review Candidate Profiles" },
  { icon: "Payroll", text: "Complete Payroll" },
  { icon: "Policies", text: "Update Policies" },
];

const DEPARTMENT_COLORS = ["#ff8a00", "#ff5f3d", "#ff2d8f", "#ffb347", "#ff6b57", "#c084fc"];

const HRDashboard = ({ preview }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Today snapshot");
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "hr";

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(apiUrl("/api/attendance/admin/today-snapshot"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAttendanceSnapshot(res.data.data);
      } catch (err) {
        console.error("Error fetching attendance snapshot:", err);
      }
    };

    fetchAttendance();
    const interval = setInterval(fetchAttendance, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const attendanceTrendData = useMemo(() => {
    if (!attendanceSnapshot) return [];

    return [
      { label: "Present", count: attendanceSnapshot.presentCount || 0 },
      { label: "Active", count: attendanceSnapshot.clockedInCount || 0 },
      { label: "Late", count: attendanceSnapshot.lateCount || 0 },
      { label: "On Leave", count: attendanceSnapshot.onLeaveCount || 0 },
      { label: "Absent", count: attendanceSnapshot.absentCount || 0 },
      { label: "Overtime", count: attendanceSnapshot.overtimeCount || 0 },
    ];
  }, [attendanceSnapshot]);

  const departmentData = useMemo(() => {
    const employees = attendanceSnapshot?.employees || [];
    const groupedDepartments = employees.reduce((acc, employee) => {
      const department = employee.department || "General";
      acc[department] = (acc[department] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedDepartments).map(([name, value], index) => ({
      name,
      value,
      color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
    }));
  }, [attendanceSnapshot]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "status-approved";
      case "Pending":
        return "status-pending";
      case "Rejected":
        return "status-rejected";
      default:
        return "";
    }
  };

  return (
    <div className="hr-dashboard">
      <div className="hr-hero">
        <div className="hr-hero-left">
          <div className="hr-badge">NETCRADUS HR COMMAND CENTER</div>
          <h1 className="hr-title">Welcome, {userName}</h1>
          <p className="hr-role-line">Role: <strong>{userRole}</strong></p>
          <div className="nc-attendance-brief hr-attendance-brief">
            <p className="nc-attendance-kicker">
              <Clock3 size={14} />
              Attendance System
            </p>
            <h2 className="nc-attendance-heading">Attendance system live for your shift</h2>
            <p className="nc-attendance-copy">
              Keep your work timer, punch status, and break controls visible while managing people operations.
            </p>
          </div>
          <p className="hr-subtitle">
            Manage people operations, hiring pipeline, workforce trends and leave activity from one branded control panel.
          </p>
        </div>

        <div className="hr-hero-right">
          <AttendanceWidget />
        </div>
      </div>

      <div className="header-right hr-header-actions hr-toolbar">
          <span className="header-date">October 26, 2023</span>
          <div className="search-box glass-card">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search employee, leave, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="user-profile glass-card">
            <CircleUserRound size={26} />
          </div>
      </div>

      {attendanceSnapshot && (
        <div
          className="admin-att-strip glass-panel"
          style={{ padding: "15px 20px", marginBottom: "24px", cursor: "pointer" }}
          onClick={() => navigate("/admin/attendance")}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}
          >
            <div className="live-dot" />
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "#8892a4",
                textTransform: "uppercase",
              }}
            >
              Real-time Team Attendance
            </span>
          </div>
          <div className="snap-metrics-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            <div className="snap-mini-card">
              <span className="snap-val" style={{ fontSize: "1.2rem", color: "#86efac" }}>
                {attendanceSnapshot.presentCount}
              </span>
              <span className="snap-lab" style={{ fontSize: "0.65rem" }}>
                Present
              </span>
            </div>
            <div className="snap-mini-card">
              <span className="snap-val" style={{ fontSize: "1.2rem", color: "#60a5fa" }}>
                {attendanceSnapshot.clockedInCount}
              </span>
              <span className="snap-lab" style={{ fontSize: "0.65rem" }}>
                Active
              </span>
            </div>
            <div className="snap-mini-card">
              <span className="snap-val" style={{ fontSize: "1.2rem", color: "#fbbf24" }}>
                {attendanceSnapshot.lateCount}
              </span>
              <span className="snap-lab" style={{ fontSize: "0.65rem" }}>
                Late
              </span>
            </div>
            <div className="snap-mini-card">
              <span className="snap-val" style={{ fontSize: "1.2rem", color: "#c7d2fe" }}>
                {attendanceSnapshot.onLeaveCount}
              </span>
              <span className="snap-lab" style={{ fontSize: "0.65rem" }}>
                On Leave
              </span>
            </div>
            <div className="snap-mini-card">
              <span className="snap-val" style={{ fontSize: "1.2rem", color: "#fca5a5" }}>
                {attendanceSnapshot.absentCount}
              </span>
              <span className="snap-lab" style={{ fontSize: "0.65rem" }}>
                Absent
              </span>
            </div>
            <div className="snap-mini-card">
              <span className="snap-val" style={{ fontSize: "1.2rem", color: "#f472b6" }}>
                {attendanceSnapshot.overtimeCount}
              </span>
              <span className="snap-lab" style={{ fontSize: "0.65rem" }}>
                Overtime
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card net-card gradient-orange">
          <div className="metric-icon metric-orange">
            <Users size={22} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Employees</div>
            <div className="metric-value">
              1,250 <span className="metric-change positive">+3%</span>
            </div>
          </div>
        </div>

        <div className="metric-card net-card gradient-coral">
          <div className="metric-icon metric-coral">
            <BriefcaseBusiness size={22} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Open Positions</div>
            <div className="metric-value">
              45 <span className="metric-subtext">12 new this month</span>
            </div>
          </div>
        </div>

        <div className="metric-card net-card gradient-pink">
          <div className="metric-icon metric-pink">
            <ArrowRightLeft size={22} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Employee Turnover</div>
            <div className="metric-value">
              4.8% <span className="metric-change negative">-1.1%</span>
            </div>
          </div>
        </div>

        <div className="metric-card net-card gradient-gold">
          <div className="metric-icon metric-gold">
            <PlaneTakeoff size={22} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Pending Leave Requests</div>
            <div className="metric-value">
              68 <span className="metric-subtext">25 awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card large net-panel">
          <div className="chart-header">
            <h3>Live Attendance Trend</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="chart-select"
            >
              <option>Today snapshot</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={attendanceTrendData}>
              <defs>
                <linearGradient id="headcountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff8a00" stopOpacity={0.35} />
                  <stop offset="55%" stopColor="#ff5f3d" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#ff2d8f" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" stroke="#b7b7b7" style={{ fontSize: "12px" }} />
              <YAxis stroke="#b7b7b7" style={{ fontSize: "12px" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#111116",
                  border: "1px solid rgba(255, 138, 0, 0.18)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Area type="monotone" dataKey="count" stroke="none" fill="url(#headcountGradient)" />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ff7a18"
                strokeWidth={3}
                dot={{ fill: "#ff5f3d", r: 4 }}
                activeDot={{ r: 7, fill: "#ff2d8f" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card net-panel">
          <div className="chart-header">
            <h3>Department Distribution</h3>
            <span className="mini-chip">Attendance Team Split</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={3}
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#111116",
                  border: "1px solid rgba(255, 138, 0, 0.18)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {departmentData.map((dept, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: dept.color }} />
                <span className="legend-label">{dept.name}</span>
                <span className="legend-value">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-section">
        <div className="table-card net-panel">
          <div className="section-header-row">
            <h3 className="table-title">Recent Leave Requests</h3>
            <button className="section-action-btn">Manage Requests</button>
          </div>

          <div className="table-wrapper">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Request Date</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Photo">
                      <div className="photo-circle">{request.photo}</div>
                    </td>
                    <td data-label="Name">{request.name}</td>
                    <td data-label="Dept">{request.dept}</td>
                    <td data-label="Request Date">{request.requestDate}</td>
                    <td data-label="Leave Type">{request.leaveType}</td>
                    <td data-label="Dates">{request.dates}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${getStatusClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <button className="action-btn">
                        View <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sidebar-cards">
          <div className="sidebar-card net-panel">
            <h3 className="sidebar-title">Upcoming Work Anniversaries</h3>
            <div className="anniversary-list">
              <div className="anniversary-header">
                <span>Names</span>
                <span>Dates</span>
                <span>Depts</span>
              </div>
              {anniversaries.map((person, index) => (
                <div key={index} className="anniversary-item">
                  <span>{person.name}</span>
                  <span>{person.date}</span>
                  <span>{person.dept}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card net-panel">
            <h3 className="sidebar-title">Quick Access Tasks</h3>
            <div className="quick-tasks">
              {quickTasks.map((task, index) => (
                <div key={index} className="task-item">
                  <span className="task-icon">{task.icon}</span>
                  <span className="task-text">{task.text}</span>
                  <span className="task-arrow">{">"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
