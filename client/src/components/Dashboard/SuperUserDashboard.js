import React, { useEffect, useMemo, useRef, useState } from "react";
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
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import axios from "axios";
// No longer needed: import "./AdminDashboard.css"; // Reuse existing styles

import AdminDashboard from "./AdminDashboard";
import SalesDashboard from "./SalesDashboard";
import SupportDashboard from "./SupportDashboard";
import HRDashboard from "./HRDashboard";
import TechDashboard from "./TechDashboard";
import DigitalMediaDashboard from "./DigitalMediaDashboard";
import { apiUrl } from "../../config/api";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import ManagementDashboard from "./ManagementDashboard";

const PIE_COLORS = ["#ff7a18", "#ff5f3d", "#ff3f6c", "#ff2d8f", "#ff8a00", "#c084fc"];

const formatRoleLabel = (role = "general") =>
  role === "admin"
    ? "Administrator"
    : role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const SuperUserDashboard = () => {
  const previewRef = useRef(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const [error, setError] = useState("");
  const userName = localStorage.getItem("userName") || "Super User";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(apiUrl("/api/auth/users"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [token]);

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

  const liveAttendanceChartData = useMemo(() => {
    if (!attendanceSnapshot) return [];
    return [
      { label: "Present", count: attendanceSnapshot.presentCount || 0 },
      { label: "Active", count: attendanceSnapshot.clockedInCount || 0 },
      { label: "Late", count: attendanceSnapshot.lateCount || 0 },
      { label: "On Leave", count: attendanceSnapshot.onLeaveCount || 0 },
      { label: "Absent", count: attendanceSnapshot.absentCount || 0 },
    ];
  }, [attendanceSnapshot]);

  const roleDistributionData = useMemo(() => {
    const employees = attendanceSnapshot?.employees || [];
    const groupedRoles = employees.reduce((acc, employee) => {
      const roleLabel = formatRoleLabel(employee.role || "general");
      acc[roleLabel] = (acc[roleLabel] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedRoles).map(([name, value]) => ({ name, value }));
  }, [attendanceSnapshot]);

  const registeredRoleData = useMemo(() => {
    const grouped = users.reduce((acc, user) => {
      const label = formatRoleLabel(user.role || "general");
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  const systemHealthTrendData = useMemo(() => [
    { point: "Users", total: users.length },
    { point: "Tracked", total: attendanceSnapshot?.employees?.length || 0 },
    { point: "Present", total: attendanceSnapshot?.presentCount || 0 },
    { point: "Active", total: attendanceSnapshot?.clockedInCount || 0 },
    { point: "Leave", total: attendanceSnapshot?.onLeaveCount || 0 },
  ], [users, attendanceSnapshot]);

  useEffect(() => {
    if (selectedRole && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedRole, selectedUser]);

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setSelectedUser(null);
  };

  const handleSearch = () => {
    const searchValue = search.toLowerCase().trim();
    if (!searchValue) return;

    const foundUser = users.find(
      (user) =>
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        user.role?.toLowerCase().includes(searchValue)
    );

    if (foundUser) {
      setSelectedUser(foundUser);
      setSelectedRole(foundUser.role);
      setError("");
    } else {
      setError("User not found");
      setTimeout(() => setError(""), 3000);
    }
  };

  const renderSelectedDashboard = () => {
    const role = selectedUser ? selectedUser.role : selectedRole;
    switch (role) {
      case "admin": return <AdminDashboard />;
      case "sales": return <SalesDashboard preview={!selectedUser} />;
      case "support": return <SupportDashboard preview={!selectedUser} />;
      case "hr": return <HRDashboard preview={!selectedUser} />;
      case "it": return <TechDashboard preview={!selectedUser} />;
      case "digital_media": return <DigitalMediaDashboard preview={!selectedUser} />;
      case "management": return <ManagementDashboard preview={!selectedUser} />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">System Overview</h1>
          <p className="subtitle">Welcome back, {userName}. Monitoring {users.length} registered users.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div className="form-field">
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '200px' }}
              />
              <button onClick={handleSearch} className="btn btn-primary">
                Search
              </button>
            </div>
          </div>
          <select className="form-select" value={selectedRole} onChange={handleRoleChange} style={{ width: '180px' }}>
            <option value="">Filter by Role</option>
            <option value="admin">Administrator</option>
            <option value="sales">Sales</option>
            <option value="support">Support</option>
            <option value="hr">HR</option>
            <option value="it">IT</option>
            <option value="digital_media">Digital Media</option>
            <option value="management">Management</option>
            <option value="all">All Roles</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="badge badge-error" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', width: '100%' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Total Users</span>
          <span className="metric-value">{users.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Present Today</span>
          <span className="metric-value">{attendanceSnapshot?.presentCount || 0}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">On Leave</span>
          <span className="metric-value">{attendanceSnapshot?.onLeaveCount || 0}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">System Health</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>100%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
         <div className="nc-card">
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Live System Attendance</h3>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={liveAttendanceChartData}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="nc-card">
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Role Distribution</h3>
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

      {selectedRole && (
        <div ref={previewRef} className="nc-card" style={{ marginTop: 'var(--space-6)', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)' }}>Role Preview: {formatRoleLabel(selectedUser ? selectedUser.role : selectedRole)}</h3>
            <button className="btn btn-ghost" onClick={() => {setSelectedRole(""); setSelectedUser(null);}}>Close Preview</button>
          </div>
          {renderSelectedDashboard()}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
        <div className="nc-card">
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Registered Users by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={registeredRoleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-accent-muted)" stroke="var(--color-accent)" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="nc-card">
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>System Coverage Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={systemHealthTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="point" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-bg-surface)", stroke: "var(--color-accent)", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      <div className="nc-card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Team Attendance Live</h3>
        <AttendanceWidget />
      </div>
    </div>
  );
};

export default SuperUserDashboard;
