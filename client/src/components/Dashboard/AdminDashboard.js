import React, { useEffect, useMemo, useState } from "react";
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
} from "recharts";
import axios from "axios";
import "./AdminDashboard.css";
import { apiUrl } from "../../config/api";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";

const PIE_COLORS = ["#ff7a18", "#ff5f3d", "#ff3f6c", "#ff2d8f", "#ff8a00", "#c084fc"];

const formatRoleLabel = (role = "general") =>
  role === "admin"
    ? "Administrator"
    : role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const AdminDashboard = () => {
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "admin";
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

  const totalUsers = attendanceSnapshot?.employees?.length || 0;
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

  const activeRatio = trackedEmployees
    ? Math.round(((attendanceSnapshot?.clockedInCount || 0) / trackedEmployees) * 100)
    : 0;

  const attendanceHealth =
    (attendanceSnapshot?.absentCount || 0) <= Math.max(1, Math.floor(trackedEmployees * 0.2))
      ? "Good"
      : "Needs Review";

  return (
    <div className="admin-dashboard">
      <div className="admin-hero">
        <div className="admin-hero-left">
          <div className="admin-badge netcradus-badge">
            <FaUserShield />
            <span>NETCRADUS Administrator Panel</span>
          </div>
          <h1>
            Welcome, <span>{userName}</span>
          </h1>
          <p>
            Role: <strong>{formatRoleLabel(userRole)}</strong> - Monitor users, analytics and system
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

      <div className="admin-grid">
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>Department Strength</h3>
            <span className="chip">Employees</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={departmentChartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="deptBarGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff8a00" stopOpacity={0.95} />
                  <stop offset="55%" stopColor="#ff5f3d" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#ff2d8f" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} interval={0} angle={departmentChartData.length > 4 ? -18 : 0} textAnchor={departmentChartData.length > 4 ? "end" : "middle"} height={departmentChartData.length > 4 ? 60 : 30} />
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
              <Bar dataKey="total" fill="url(#deptBarGrad)" radius={[10, 10, 0, 0]} />
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

    </div>
  );
};

export default AdminDashboard;
