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

  const renderSelectedDashboard = () => {
    const role = selectedUser ? selectedUser.role : selectedRole;
    switch (role) {
      case "admin": return <p>Administrator oversight active</p>;
      case "sales": return <SalesDashboard preview={!selectedUser} />;
      case "support": return <SupportDashboard preview={!selectedUser} />;
      case "hr": return <HRDashboard preview={!selectedUser} />;
      case "it": return <TechDashboard preview={!selectedUser} />;
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
    </div>
  );
};

export default SuperUserDashboard;
