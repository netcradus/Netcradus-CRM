import React, { useEffect, useMemo, useState } from "react";
import {
  CircleUserRound,
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
  BarChart,
  Bar,
} from "recharts";
import "./HRDashboard.css";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/api";

const DEPARTMENT_COLORS = ["#ff8a00", "#ff5f3d", "#ff2d8f", "#ffb347", "#ff6b57", "#c084fc"];
const LEAVE_STATUS_COLORS = {
  approved: "#ff8a00",
  pending: "#60a5fa",
  rejected: "#ff5f3d",
};

const formatRoleLabel = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const HRDashboard = ({ preview }) => {
  const [selectedMonth, setSelectedMonth] = useState("Today snapshot");
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState({
    totalSpend: 0,
    totalEntries: 0,
    categoryBreakdown: [],
    monthlyTrend: [],
  });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "hr";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [attendanceRes, leaveRes, expenseSummaryRes] = await Promise.all([
          axios.get(apiUrl("/api/attendance/admin/today-snapshot"), { headers }),
          axios.get(apiUrl("/api/leave/applications"), { headers }),
          axios.get(apiUrl("/api/expenses/dashboard-summary"), { headers }),
        ]);

        setAttendanceSnapshot(attendanceRes.data.data);
        setLeaveApplications(leaveRes.data.data || []);
        setExpenseSummary(
          expenseSummaryRes.data || {
            totalSpend: 0,
            totalEntries: 0,
            categoryBreakdown: [],
            monthlyTrend: [],
          }
        );
      } catch (err) {
        setAttendanceSnapshot(null);
        setLeaveApplications([]);
        setExpenseSummary({
          totalSpend: 0,
          totalEntries: 0,
          categoryBreakdown: [],
          monthlyTrend: [],
        });
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
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

  const departmentStrengthData = useMemo(
    () =>
      departmentData
        .map((department) => ({
          name: department.name,
          total: department.value,
          fill: department.color,
        }))
        .sort((a, b) => b.total - a.total),
    [departmentData]
  );

  const leaveStatusData = useMemo(() => {
    const groupedStatus = leaveApplications.reduce((acc, application) => {
      const status = String(application.status || "pending").toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedStatus).map(([name, value]) => ({
      name: formatRoleLabel(name),
      value,
      color: LEAVE_STATUS_COLORS[name] || "#c084fc",
    }));
  }, [leaveApplications]);

  const expenseCategoryData = useMemo(
    () =>
      (expenseSummary.categoryBreakdown || []).slice(0, 5).map((item, index) => ({
        name: item.name,
        totalAmount: Math.round(item.totalAmount || 0),
        entryCount: item.entryCount || 0,
        fill: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
      })),
    [expenseSummary]
  );

  const expenseTrendData = useMemo(
    () =>
      (expenseSummary.monthlyTrend || []).slice(-6).map((item) => ({
        month: item.month,
        totalAmount: Math.round(item.totalAmount || 0),
      })),
    [expenseSummary]
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  return (
    <div className="hr-dashboard">
      <div className="hr-hero">
        <div className="hr-hero-left">
          <div className="hr-badge">NETCRADUS HR COMMAND CENTER</div>
          <h1 className="hr-title">Welcome, {userName}</h1>
          <p className="hr-role-line">Role: <strong>{formatRoleLabel(userRole)}</strong></p>
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
          <span className="header-date">
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
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

      {/* <div className="metrics-grid">
        <div className="metric-card net-card gradient-orange">
          <div className="metric-icon metric-orange">
            <Users size={22} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Employees</div>
            <div className="metric-value">
              {attendanceSnapshot?.employees?.length || 0}
              <span className="metric-subtext"> tracked today</span>
            </div>
          </div>
        </div>

        <div className="metric-card net-card gradient-coral">
          <div className="metric-icon metric-coral">
            <BriefcaseBusiness size={22} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Active Workforce</div>
            <div className="metric-value">
              {attendanceSnapshot?.clockedInCount || 0}
              <span className="metric-subtext"> currently punched in</span>
            </div>
          </div>
        </div>

        <div className="metric-card net-card gradient-pink">
          <div className="metric-icon metric-pink">
            <ArrowRightLeft size={22} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Late Arrivals</div>
            <div className="metric-value">
              {attendanceSnapshot?.lateCount || 0}
              <span className="metric-subtext"> need follow-up</span>
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
              {pendingLeaves.length}
              <span className="metric-subtext"> awaiting review</span>
            </div>
          </div>
        </div>
      </div> */}

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

      <div className="charts-section charts-section-secondary">
        <div className="chart-card net-panel">
          <div className="chart-header">
            <div>
              <h3>Department Strength</h3>
              <p className="chart-copy">Live employee count by department.</p>
            </div>
            <span className="mini-chip">Headcount</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={departmentStrengthData}
              layout="vertical"
              margin={{ top: 10, right: 16, left: 12, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis type="number" stroke="#b7b7b7" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#b7b7b7"
                width={88}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                formatter={(value) => [value, "Employees"]}
                contentStyle={{
                  background: "#111116",
                  border: "1px solid rgba(255, 138, 0, 0.18)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="total" radius={[0, 10, 10, 0]}>
                {departmentStrengthData.map((entry, index) => (
                  <Cell key={`dept-strength-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card net-panel">
          <div className="chart-header">
            <div>
              <h3>Expense by Category</h3>
              <p className="chart-copy">Live spend summary from saved expense entries.</p>
            </div>
            <span className="mini-chip">{expenseSummary.totalEntries || 0} entries</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={expenseCategoryData}
              layout="vertical"
              margin={{ top: 10, right: 16, left: 12, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis type="number" stroke="#b7b7b7" tickFormatter={(value) => `Rs ${value}`} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#b7b7b7"
                width={72}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                formatter={(value) => [formatCurrency(value), "Spend"]}
                contentStyle={{
                  background: "#111116",
                  border: "1px solid rgba(255, 138, 0, 0.18)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="totalAmount" radius={[0, 10, 10, 0]}>
                {expenseCategoryData.map((entry, index) => (
                  <Cell key={`expense-category-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bottom-section">
        <div className="table-card net-panel">
          <div className="chart-header">
            <div>
              <h3 className="table-title">Expense Trend</h3>
              <p className="chart-copy">Monthly expense movement from your live expense records.</p>
            </div>
            <button className="section-action-btn" onClick={() => navigate("/expenses")}>
              Open Expenses
            </button>
          </div>

          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={expenseTrendData}>
              <defs>
                <linearGradient id="expenseTrendGradientLarge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="#b7b7b7" tick={{ fontSize: 12 }} />
              <YAxis stroke="#b7b7b7" tickFormatter={(value) => `Rs ${value}`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Spend"]}
                contentStyle={{
                  background: "#111116",
                  border: "1px solid rgba(255, 138, 0, 0.18)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Area type="monotone" dataKey="totalAmount" stroke="#60a5fa" fill="url(#expenseTrendGradientLarge)" />
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke="#dbeafe"
                strokeWidth={3}
                dot={{ fill: "#dbeafe", r: 4 }}
                activeDot={{ r: 6, fill: "#ffffff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="sidebar-cards">
          <div className="sidebar-card net-panel">
            <div className="chart-header chart-header-inline">
              <div>
                <h3 className="sidebar-title">Leave Status Mix</h3>
                <p className="chart-copy">Approved, pending and rejected requests.</p>
              </div>
              <span className="mini-chip">{leaveApplications.length} total</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={leaveStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={4}
                >
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`leave-status-${index}`} fill={entry.color} />
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
            <div className="pie-legend compact-legend">
              {leaveStatusData.length ? (
                leaveStatusData.map((item) => (
                  <div key={item.name} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }} />
                    <span className="legend-label">{item.name}</span>
                    <span className="legend-value">{item.value}</span>
                  </div>
                ))
              ) : (
                <div className="legend-empty">No leave applications yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
