import React, { useEffect, useMemo, useState } from "react";
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
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/api";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";

const DEPARTMENT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];
const LEAVE_STATUS_COLORS = {
  approved: "var(--color-success)",
  pending: "var(--color-warning)",
  rejected: "var(--color-error)",
};

const formatRoleLabel = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const HRDashboard = ({ preview }) => {
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

  const leaveStatusData = useMemo(() => {
    const groupedStatus = leaveApplications.reduce((acc, application) => {
      const status = String(application.status || "pending").toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedStatus).map(([name, value]) => ({
      name: formatRoleLabel(name),
      value,
      color: LEAVE_STATUS_COLORS[name] || "var(--color-bg-elevated)",
    }));
  }, [leaveApplications]);

  const expenseCategoryData = useMemo(
    () =>
      (expenseSummary.categoryBreakdown || []).slice(0, 5).map((item, index) => ({
        name: item.name,
        totalAmount: Math.round(item.totalAmount || 0),
        fill: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
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
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">HR Dashboard</h1>
          <p className="subtitle">People operations and workforce analytics center.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card" onClick={() => navigate("/admin/attendance")} style={{ cursor: 'pointer' }}>
          <span className="metric-label">Total Employees</span>
          <span className="metric-value">{attendanceSnapshot?.employees?.length || 0}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Workforce</span>
          <span className="metric-value">{attendanceSnapshot?.clockedInCount || 0}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Late Arrivals</span>
          <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{attendanceSnapshot?.lateCount || 0}</span>
        </div>
        <div className="nc-stat-card" onClick={() => navigate("/leave")} style={{ cursor: 'pointer' }}>
          <span className="metric-label">Leave Requests</span>
          <span className="metric-value">{leaveApplications.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Total Spend</span>
          <span className="metric-value">{formatCurrency(expenseSummary.totalSpend)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Live Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceTrendData}>
              <defs>
                <linearGradient id="headcountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} fill="url(#headcountGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Department Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={departmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            {departmentData.map((dept, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', background: 'var(--color-bg-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dept.color }} />
                <span>{dept.name} ({dept.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Expense by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseCategoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={12} width={100} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="totalAmount" radius={[0, 4, 4, 0]}>
                {expenseCategoryData.map((entry, index) => (
                  <Cell key={`expense-category-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Leave Status Mix</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={leaveStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {leaveStatusData.map((entry, index) => (
                  <Cell key={`leave-status-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            {leaveStatusData.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="nc-card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Real-time Team Status</h3>
        <AttendanceWidget />
      </div>
    </div>
  );
};

export default HRDashboard;
