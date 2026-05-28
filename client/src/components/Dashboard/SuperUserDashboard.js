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
import WorkspaceWidget from "./WorkspaceWidget";
 
const DASHBOARD_REFRESH_MS = 300000;
const DASHBOARD_REQUEST_TIMEOUT_MS = 10000;
const initialReminderForm = { title: "", meetingLink: "", meetingDate: "", meetingTime: "" };
const GRAPH_TABS = [
  { key: "liveAttendance", label: "Live Attendance" },
  { key: "roleDistribution", label: "Role Distribution" },
  { key: "registeredRoles", label: "Registered Roles" },
  { key: "coverageTrend", label: "Coverage Trend" },
];
 
const PIE_COLORS = ["#ff7a18", "#ff5f3d", "#ff3f6c", "#ff2d8f", "#ff8a00", "#c084fc"];
 
const formatRoleLabel = (role = "general") =>
  role === "admin"
    ? "Administrator"
    : role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
 
const SuperUserDashboard = () => {
  const previewRef = useRef(null);
  const graphRef = useRef(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGraph, setSelectedGraph] = useState("liveAttendance");
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [meetingReminders, setMeetingReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState(initialReminderForm);
  const [reminderStatus, setReminderStatus] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);
  const userName = localStorage.getItem("userName") || "Super User";
  const token = localStorage.getItem("token");
 
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(apiUrl("/api/auth/users"), {
          headers: { Authorization: `Bearer ${token}` },
          timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
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
          timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
        });
        setAttendanceSnapshot(res.data.data);
      } catch (err) {
        console.error("Error fetching attendance snapshot:", err);
      }
    };
    fetchAttendance();
    const interval = setInterval(fetchAttendance, DASHBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, [token]);

  const fetchMeetingReminders = async () => {
    try {
      const res = await axios.get(apiUrl("/api/meeting-reminders"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setMeetingReminders(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching meeting reminders:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMeetingReminders();
    }
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

  const upcomingMeetingReminders = useMemo(() => {
    const now = Date.now();
    return meetingReminders
      .filter((reminder) => new Date(reminder.meetingAt).getTime() >= now)
      .slice(0, 5);
  }, [meetingReminders]);
 
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

  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    setSavingReminder(true);
    setReminderStatus("");

    try {
      const meetingAt = new Date(`${reminderForm.meetingDate}T${reminderForm.meetingTime}`);

      await axios.post(
        apiUrl("/api/meeting-reminders"),
        {
          title: reminderForm.title,
          meetingLink: reminderForm.meetingLink,
          meetingAt: meetingAt.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
        }
      );
      setReminderForm(initialReminderForm);
      setReminderStatus("Reminder set successfully.");
      fetchMeetingReminders();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to set reminder.";
      setReminderStatus(message);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await axios.delete(apiUrl(`/api/meeting-reminders/${reminderId}`), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setMeetingReminders((current) => current.filter((reminder) => reminder._id !== reminderId));
    } catch (err) {
      setReminderStatus(err.response?.data?.message || "Failed to delete reminder.");
    }
  };

  const handleGraphTabClick = (graphKey) => {
    setSelectedGraph(graphKey);
    setTimeout(() => {
      graphRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
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

  const renderSelectedGraph = () => {
    switch (selectedGraph) {
      case "roleDistribution":
        return (
          <ResponsiveContainer width="100%" height={420}>
             <PieChart>
                <Pie
                  data={roleDistributionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={90}
                  outerRadius={130}
                  paddingAngle={4}
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
             </PieChart>
          </ResponsiveContainer>
        );
      case "registeredRoles":
        return (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={registeredRoleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-accent-muted)" stroke="var(--color-accent)" strokeWidth={1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "coverageTrend":
        return (
          <ResponsiveContainer width="100%" height={420}>
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
        );
      case "liveAttendance":
      default:
        return (
          <ResponsiveContainer width="100%" height={420}>
             <BarChart data={liveAttendanceChartData}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
             </BarChart>
          </ResponsiveContainer>
        );
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
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
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
 
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <WorkspaceWidget />
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--text-base)' }}>Set Meeting Reminder</h3>
            <p className="subtitle" style={{ margin: 0 }}>Bell notifications are sent 1 hour and 15 minutes before the meeting.</p>
          </div>
        </div>

        <form onSubmit={handleReminderSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', alignItems: 'end' }}>
          <div className="form-field">
            <label className="form-label">Meeting Title</label>
            <input
              className="form-input"
              required
              value={reminderForm.title}
              onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
              placeholder="Client sync"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Meeting Link</label>
            <input
              className="form-input"
              required
              type="url"
              value={reminderForm.meetingLink}
              onChange={(e) => setReminderForm({ ...reminderForm, meetingLink: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div className="form-field">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              required
              type="date"
              value={reminderForm.meetingDate}
              onChange={(e) => setReminderForm({ ...reminderForm, meetingDate: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Time</label>
            <input
              className="form-input"
              required
              type="time"
              value={reminderForm.meetingTime}
              onChange={(e) => setReminderForm({ ...reminderForm, meetingTime: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={savingReminder}>
            {savingReminder ? "Saving..." : "Set Reminder"}
          </button>
        </form>

        {reminderStatus && (
          <div className="badge badge-warning" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)' }}>
            {reminderStatus}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Upcoming Reminders</h4>
          {upcomingMeetingReminders.length === 0 ? (
            <p className="subtitle" style={{ margin: 0 }}>No upcoming meeting reminders.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {upcomingMeetingReminders.map((reminder) => (
                <div
                  key={reminder._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 'var(--space-3)',
                    alignItems: 'center',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>{reminder.title}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                      {new Date(reminder.meetingAt).toLocaleString()} · {reminder.meetingLink}
                    </div>
                  </div>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDeleteReminder(reminder._id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
 
      <div ref={graphRef} className="nc-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 'var(--text-base)' }}>
            {GRAPH_TABS.find((tab) => tab.key === selectedGraph)?.label || "Live Attendance"}
          </h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {GRAPH_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn ${selectedGraph === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleGraphTabClick(tab.key)}
                style={{ height: '32px', fontSize: 'var(--text-xs)', padding: '0 var(--space-3)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {renderSelectedGraph()}
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
 
      <div className="nc-card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Team Attendance Live</h3>
        <AttendanceWidget />
      </div>
    </div>
  );
};
 
export default SuperUserDashboard;
 
 
