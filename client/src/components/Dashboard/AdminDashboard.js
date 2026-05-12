import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";
import { apiUrl } from "../../config/api";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import ApprovalQueueWidget from "../../features/DigitalMedia/ApprovalQueueWidget";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

const formatRoleLabel = (role = "general") =>
  role === "admin"
    ? "Administrator"
    : role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const AdminDashboard = () => {
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const token = localStorage.getItem("token");

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

  const trackedEmployees = attendanceSnapshot?.employees?.length || 0;

  const roleDistributionData = useMemo(() => {
    const employees = attendanceSnapshot?.employees || [];
    const groupedRoles = employees.reduce((acc, employee) => {
      const roleLabel = formatRoleLabel(employee.role);
      acc[roleLabel] = (acc[roleLabel] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedRoles).map(([name, value]) => ({ name, value }));
  }, [attendanceSnapshot]);

  const departmentChartData = useMemo(() => {
    const employees = attendanceSnapshot?.employees || [];
    const groupedDepartments = employees.reduce((acc, employee) => {
      const department = employee.department || "General";
      acc[department] = (acc[department] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedDepartments)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [attendanceSnapshot]);

  const attendanceStatusData = useMemo(
    () => [
      { name: "Present", total: attendanceSnapshot?.presentCount || 0, color: "var(--color-success)" },
      { name: "Active", total: attendanceSnapshot?.clockedInCount || 0, color: "var(--color-accent)" },
      { name: "Late", total: attendanceSnapshot?.lateCount || 0, color: "var(--color-warning)" },
      { name: "Leave", total: attendanceSnapshot?.onLeaveCount || 0, color: "var(--color-info)" },
      { name: "Absent", total: attendanceSnapshot?.absentCount || 0, color: "var(--color-error)" },
    ],
    [attendanceSnapshot]
  );

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Administrator Dashboard</h1>
          <p className="subtitle">Overview of system health and employee attendance.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Tracked Employees</span>
          <span className="metric-value">{trackedEmployees}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Present Today</span>
          <span className="metric-value">{attendanceSnapshot?.presentCount || 0}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Now</span>
          <span className="metric-value">{attendanceSnapshot?.clockedInCount || 0}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Attendance Health</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>Stable</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Department Strength</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
              <Bar dataKey="total" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Team Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleDistributionData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
              >
                {roleDistributionData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Attendance Status Mix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceStatusData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {attendanceStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Live Updates</h3>
          <AttendanceWidget />
        </div>
      </div>

      <ApprovalQueueWidget compact title="Digital Media Approval Queue" />
    </div>
  );
};

export default AdminDashboard;
