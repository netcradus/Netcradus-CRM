import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaUserShield } from "react-icons/fa";
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
import "./AdminDashboard.css"; // Reuse existing styles
import SalesDashboard from "./SalesDashboard";
import SupportDashboard from "./SupportDashboard";
import HRDashboard from "./HRDashboard";
import TechDashboard from "./TechDashboard";
import DigitalMediaDashboard from "./DigitalMediaDashboard";
import { apiUrl } from "../../config/api";
import { useNavigate } from "react-router-dom";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";

const PIE_COLORS = ["#ff7a18", "#ff5f3d", "#ff3f6c", "#ff2d8f", "#ff8a00", "#c084fc"];

const formatRoleLabel = (role = "general") =>
  role === "admin"
    ? "Administrator"
    : role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const SuperUserDashboard = () => {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const userName = localStorage.getItem("userName") || "Super User";
  const userRole = localStorage.getItem("userRole") || "super_user";
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

  const departmentStrengthData = useMemo(() => {
    const employees = attendanceSnapshot?.employees || [];
    const grouped = employees.reduce((acc, employee) => {
      const department = employee.department || "General";
      acc[department] = (acc[department] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [attendanceSnapshot]);

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
    } else {
      alert("User not found");
    }
  };

  const renderSelectedDashboard = () => {
    const role = selectedUser ? selectedUser.role : selectedRole;
    switch (role) {
      case "admin": return <p>Administrator oversight active</p>;
      case "sales": return <SalesDashboard preview={!selectedUser} />;
      case "support": return <SupportDashboard preview={!selectedUser} />;
      case "hr": return <HRDashboard preview={!selectedUser} />;
      case "it": return <TechDashboard preview={!selectedUser} />;
      case "digital_media": return <DigitalMediaDashboard preview={!selectedUser} />;
      default: return <p>Select a role to preview</p>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-hero">
        <div className="admin-hero-left">
          <div className="admin-badge netcradus-badge">
            <FaUserShield />
            <span>NETCRADUS Super User Control</span>
          </div>
          <h1>
            Welcome, <span>{userName}</span>
          </h1>
          <p>
            You have full system access. Monitoring performance and security status.
          </p>
        </div>
        <div className="admin-hero-right">
           <AttendanceWidget />
        </div>
      </div>

      <div className="admin-controls glass">
        <input
          type="text"
          className="admin-search"
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={handleSearch} className="btn-primary">
          Search
        </button>

        <select className="admin-select" value={selectedRole} onChange={handleRoleChange}>
          <option value="">Select Role</option>
          <option value="admin">Administrator</option>
          <option value="sales">Sales</option>
          <option value="support">Support</option>
          <option value="hr">HR</option>
          <option value="it">IT</option>
          <option value="digital_media">Digital Media</option>
        </select>
      </div>

      {selectedRole && (
        <div ref={previewRef} className="role-dashboard-preview">
          {renderSelectedDashboard()}
        </div>
      )}

      <div className="admin-grid">
         <div className="admin-charts glass netcradus-panel">
            <h3>Live System Attendance</h3>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={liveAttendanceChartData}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ff5f3d" radius={[5, 5, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="admin-side glass netcradus-panel">
            <h3>Role Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
               <PieChart>
                  <Pie
                    data={roleDistributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    fill="#8884d8"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
               </PieChart>
            </ResponsiveContainer>
            {!roleDistributionData.length && (
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginTop: "12px" }}>
                No live employee attendance data available yet.
              </p>
            )}
         </div>
      </div>

      <div className="admin-grid" style={{ marginTop: "20px" }}>
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>Registered Users by Role</h3>
            <span className="chip">Live users</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={registeredRoleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#ff8a00" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-side glass netcradus-panel">
          <div className="card-header">
            <h3>Department Snapshot</h3>
            <span className="chip">Attendance</span>
          </div>
          <ul className="insight-list">
            {departmentStrengthData.length ? (
              departmentStrengthData.slice(0, 4).map((entry) => (
                <li key={entry.name}>
                  <span>{entry.name}</span>
                  <strong>{entry.total}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>No department data</span>
                <strong>--</strong>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="admin-grid" style={{ marginTop: "20px" }}>
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>System Coverage Trend</h3>
            <span className="chip">Realtime</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={systemHealthTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="point" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#ff5f3d"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ff2d8f" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-side glass netcradus-panel">
          <div className="card-header">
            <h3>Role Search Snapshot</h3>
            <span className="chip">Overview</span>
          </div>
          <ul className="insight-list">
            <li>
              <span>Total Registered Users</span>
              <strong>{users.length}</strong>
            </li>
            <li>
              <span>Tracked in Attendance</span>
              <strong>{attendanceSnapshot?.employees?.length || 0}</strong>
            </li>
            <li>
              <span>Selected Role Preview</span>
              <strong>{selectedRole ? formatRoleLabel(selectedRole) : "--"}</strong>
            </li>
            <li>
              <span>Selected User</span>
              <strong>{selectedUser?.name || "--"}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuperUserDashboard;
