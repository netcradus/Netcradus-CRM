import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaUserShield } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";
import "./AdminDashboard.css";
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
  role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const AdminDashboard = () => {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "Admin";
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

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedRole, selectedUser]);

  const totalUsers = users.length;
  const trackedEmployees = attendanceSnapshot?.employees?.length || 0;

  const liveAttendanceChartData = useMemo(() => {
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

  const roleDistributionData = useMemo(() => {
    const employees = attendanceSnapshot?.employees || [];
    const groupedRoles = employees.reduce((acc, employee) => {
      const roleLabel = formatRoleLabel(employee.role);
      acc[roleLabel] = (acc[roleLabel] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedRoles).map(([name, value]) => ({ name, value }));
  }, [attendanceSnapshot]);

  const activeRatio = trackedEmployees
    ? Math.round(((attendanceSnapshot?.clockedInCount || 0) / trackedEmployees) * 100)
    : 0;

  const attendanceHealth =
    (attendanceSnapshot?.absentCount || 0) <= Math.max(1, Math.floor(trackedEmployees * 0.2))
      ? "Good"
      : "Needs Review";

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setSelectedUser(null);
  };

  const handleSearch = () => {
    const searchValue = search.toLowerCase().trim();

    const foundUser = users.find(
      (user) =>
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        user.role.toLowerCase().includes(searchValue)
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
      case "sales":
        return <SalesDashboard preview={!selectedUser} />;
      case "support":
        return <SupportDashboard preview={!selectedUser} />;
      case "hr":
        return <HRDashboard preview={!selectedUser} />;
      case "it":
        return <TechDashboard preview={!selectedUser} />;
      case "digital_media":
        return <DigitalMediaDashboard preview={!selectedUser} />;
      default:
        return <p>No dashboard found</p>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-hero">
        <div className="admin-hero-left">
          <div className="admin-badge netcradus-badge">
            <FaUserShield />
            <span>NETCRADUS Admin Panel</span>
          </div>
          <h1>
            Welcome, <span>{userName}</span>
          </h1>
          <p>
            Role: <strong>{userRole}</strong> - Monitor users, analytics and system
            performance in real time.
          </p>
        </div>

        <div className="admin-hero-right netcradus-status">
          <div className="dashboard-attendance-stack">
            <div className="dashboard-attendance-status">
              <div className="live-dot" />
              <span>NETCRADUS System Active</span>
            </div>
            <AttendanceWidget />
          </div>
        </div>
      </div>

      {(userRole === "admin" || userRole === "hr") && attendanceSnapshot && (
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

        <select className="admin-select" onChange={handleRoleChange}>
          <option value="">Select Role</option>
          <option value="sales">Sales</option>
          <option value="support">Support</option>
          <option value="hr">HR</option>
          <option value="it">IT</option>
          <option value="digital_media">Digital Media</option>
        </select>
      </div>

      <div className="admin-grid">
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>Live Attendance Overview</h3>
            <span className="chip">Today</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={liveAttendanceChartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff8a00" stopOpacity={0.95} />
                  <stop offset="50%" stopColor="#ff5f3d" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#ff2d8f" stopOpacity={0.75} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="label" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                contentStyle={{
                  background: "#111116",
                  border: "1px solid rgba(255, 138, 0, 0.18)",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="url(#barGrad)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-side glass netcradus-panel">
          <div className="card-header">
            <h3>Team Distribution</h3>
            <span className="chip">Live Roles</span>
          </div>

          <div className="pie-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={roleDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  contentStyle={{
                    background: "#111116",
                    border: "1px solid rgba(255, 138, 0, 0.18)",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="insight-list">
            <li>
              <span>Tracked Employees</span>
              <strong>{trackedEmployees || totalUsers}</strong>
            </li>
            <li>
              <span>Active Right Now</span>
              <strong>{activeRatio}%</strong>
            </li>
            <li>
              <span>On Leave Today</span>
              <strong>{attendanceSnapshot?.onLeaveCount || 0}</strong>
            </li>
            <li>
              <span>Attendance Health</span>
              <strong className={attendanceHealth === "Good" ? "good" : ""}>
                {attendanceHealth}
              </strong>
            </li>
          </ul>
        </div>
      </div>

      {selectedRole && (
        <div ref={previewRef} className="role-dashboard-preview">
          {renderSelectedDashboard()}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
