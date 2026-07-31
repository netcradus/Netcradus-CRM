import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
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
import ManagerDashboard from "../../features/ManagerPortal/ManagerDashboard";
import COODashboard from "./COODashboard";
 
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

  const navigate = useNavigate();
  const [modalType, setModalType] = useState(null); // 'totalUsers' or 'presentToday' or null
  const [profiles, setProfiles] = useState([]);
  
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [errorUsers, setErrorUsers] = useState(null);
  const [errorAttendance, setErrorAttendance] = useState(null);
  const [errorProfiles, setErrorProfiles] = useState(null);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const res = await axios.get(apiUrl("/api/auth/users"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setErrorUsers(err.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    setErrorAttendance(null);
    try {
      const res = await axios.get(apiUrl("/api/attendance/admin/today-snapshot"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setAttendanceSnapshot(res.data.data);
    } catch (err) {
      console.error("Error fetching attendance snapshot:", err);
      setErrorAttendance(err.response?.data?.message || err.message || "Failed to load attendance");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    setErrorProfiles(null);
    try {
      const res = await axios.get(apiUrl("/api/contacts/profiles"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setProfiles(res.data);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setErrorProfiles(err.response?.data?.message || err.message || "Failed to load profile details");
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchAttendance();
      fetchProfiles();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      const interval = setInterval(fetchAttendance, DASHBOARD_REFRESH_MS);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setModalType(null);
      }
    };
    if (modalType) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalType]);

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
      case "manager": return <ManagerDashboard preview={!selectedUser} />;
      case "coo": return <COODashboard preview={!selectedUser} readOnly={true} embedded={true} />;
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
            <option value="manager">Manager</option>
            <option value="coo">COO</option>
          </select>
        </div>
      </div>
 
      {error && (
        <div className="badge badge-error" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', width: '100%' }}>
          {error}
        </div>
      )}
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div
          className="nc-stat-card clickable-card"
          role="button"
          tabIndex={0}
          onClick={() => setModalType('totalUsers')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setModalType('totalUsers');
            }
          }}
          style={{
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
          }}
        >
          <span className="metric-label">Total Users</span>
          <span className="metric-value">{users.length}</span>
        </div>
        <div
          className="nc-stat-card clickable-card"
          role="button"
          tabIndex={0}
          onClick={() => setModalType('presentToday')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setModalType('presentToday');
            }
          }}
          style={{
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
          }}
        >
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

      <style>{`
        .clickable-card:hover {
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.15) !important;
        }
        .clickable-card:focus-visible {
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.3) !important;
        }
      `}</style>

      {modalType && (
        <div
          className="nc-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalType(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            background: 'var(--color-overlay, rgba(0, 0, 0, 0.6))',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="nc-modal-content"
            style={{
              width: 'min(100%, 800px)',
              maxHeight: 'min(88vh, 720px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '28px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface-strong, #1f1f1f)',
              boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="nc-modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-5) var(--space-6)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                {modalType === 'totalUsers'
                  ? `All Registered Users (${users.length})`
                  : `Present Today (${
                      (attendanceSnapshot?.employees || []).filter(e =>
                        ['present', 'overtime', 'half_day'].includes(e.status)
                      ).length
                    })`}
              </h3>
              <button
                onClick={() => setModalType(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div
              className="nc-modal-body"
              style={{
                padding: 'var(--space-6)',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {/* Loading state */}
              {((modalType === 'totalUsers' && loadingUsers) ||
                (modalType === 'presentToday' && loadingAttendance) ||
                loadingProfiles) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)' }}>
                  <div
                    className="animate-spin"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255, 255, 255, 0.08)',
                      borderTopColor: 'var(--color-accent)',
                      borderRadius: '50%',
                      marginBottom: 'var(--space-4)',
                    }}
                  />
                  <p style={{ color: 'var(--color-text-muted)' }}>Loading records...</p>
                </div>
              )}

              {/* Error state */}
              {((modalType === 'totalUsers' && errorUsers) ||
                (modalType === 'presentToday' && errorAttendance) ||
                errorProfiles) &&
                !((modalType === 'totalUsers' && loadingUsers) ||
                  (modalType === 'presentToday' && loadingAttendance) ||
                  loadingProfiles) && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: 'var(--space-4)' }}>
                      {modalType === 'totalUsers' ? errorUsers : errorAttendance || errorProfiles}
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={
                        modalType === 'totalUsers'
                          ? () => {
                              fetchUsers();
                              fetchProfiles();
                            }
                          : () => {
                              fetchAttendance();
                              fetchProfiles();
                            }
                      }
                    >
                      Retry
                    </button>
                  </div>
                )}

              {/* Empty state */}
              {!((modalType === 'totalUsers' && loadingUsers) ||
                (modalType === 'presentToday' && loadingAttendance) ||
                loadingProfiles) &&
                !((modalType === 'totalUsers' && errorUsers) ||
                  (modalType === 'presentToday' && errorAttendance) ||
                  errorProfiles) &&
                (modalType === 'totalUsers'
                  ? users.length === 0
                  : (attendanceSnapshot?.employees || []).filter(e =>
                      ['present', 'overtime', 'half_day'].includes(e.status)
                    ).length === 0) && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    No records found.
                  </div>
                )}

              {/* Records list */}
              {!((modalType === 'totalUsers' && loadingUsers) ||
                (modalType === 'presentToday' && loadingAttendance) ||
                loadingProfiles) &&
                !((modalType === 'totalUsers' && errorUsers) ||
                  (modalType === 'presentToday' && errorAttendance) ||
                  errorProfiles) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {(modalType === 'totalUsers'
                      ? users
                      : (attendanceSnapshot?.employees || []).filter(e =>
                          ['present', 'overtime', 'half_day'].includes(e.status)
                        )
                    ).map((record) => {
                      const targetUserId = modalType === 'totalUsers' ? record._id : record.userId;
                      const userProfile = profiles.find((p) => p.linkedUser?._id === targetUserId);
                      
                      // Fields mapping
                      const fullName = record.name;
                      const email = record.email;
                      const role = record.role;
                      const department = record.department;
                      const employeeId = modalType === 'totalUsers' ? record.userId : (userProfile?.employeeId || 'N/A');
                      const designation = modalType === 'totalUsers' ? (record.designation || 'N/A') : (userProfile?.designation || 'N/A');
                      const profilePhoto = userProfile?.profilePhoto || '';
                      
                      // Card specific fields
                      const activeStatus = modalType === 'totalUsers' ? (!record.isDisabled ? 'Active' : 'Inactive') : null;
                      const checkInTime = modalType === 'presentToday' ? (record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A') : null;
                      const attendanceStatus = modalType === 'presentToday' ? record.status : null;

                      return (
                        <div
                          key={targetUserId}
                          onClick={() => {
                            setModalType(null);
                            navigate(`/employee-profiles?userId=${targetUserId}`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-4)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '16px',
                            background: 'var(--color-bg-surface, #262626)',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background-color 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-accent)';
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
                            {/* Avatar */}
                            <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                              {profilePhoto ? (
                                <img
                                  src={`${apiUrl(profilePhoto)}?token=${localStorage.getItem('token') || ''}`}
                                  alt={fullName}
                                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                style={{
                                  display: profilePhoto ? 'none' : 'flex',
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--color-bg-alt, #3f3f3f)',
                                  color: 'var(--color-text-primary, #ffffff)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '16px',
                                }}
                              >
                                {getInitials(fullName)}
                              </div>
                            </div>

                            {/* User Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {fullName}
                              </span>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                ID: {employeeId} · {designation}
                              </span>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {email}
                              </span>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: '2px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  background: 'var(--color-bg-alt, #3f3f3f)',
                                  color: 'var(--color-text-muted)'
                                }}>
                                  {formatRoleLabel(role)}
                                </span>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  background: 'var(--color-bg-alt, #3f3f3f)',
                                  color: 'var(--color-text-muted)'
                                }}>
                                  {department}
                                </span>
                                {/* Active / Inactive Badge for Total Users */}
                                {activeStatus && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    background: activeStatus === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: activeStatus === 'Active' ? '#22c55e' : '#ef4444',
                                    fontWeight: 'var(--font-semibold)'
                                  }}>
                                    {activeStatus}
                                  </span>
                                )}
                                {/* Punch in time for Present Today */}
                                {checkInTime && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    color: '#3b82f6',
                                    fontWeight: 'var(--font-semibold)'
                                  }}>
                                    In: {checkInTime}
                                  </span>
                                )}
                                {/* Attendance Status Badge for Present Today */}
                                {attendanceStatus && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    background: attendanceStatus === 'present' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                    color: attendanceStatus === 'present' ? '#22c55e' : '#eab308',
                                    fontWeight: 'var(--font-semibold)'
                                  }}>
                                    {attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalType(null);
                              navigate(`/employee-profiles?userId=${targetUserId}`);
                            }}
                            style={{
                              padding: 'var(--space-2) var(--space-4)',
                              fontSize: 'var(--text-xs)',
                              height: '32px',
                              flexShrink: 0,
                            }}
                          >
                            View Profile
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default SuperUserDashboard;
 
 
