import React, { useState, useMemo, useEffect } from "react";
import { FaUserShield } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./AdminDashboard.css";
import axios from "axios";
import { apiUrl } from "../../config/api";

const chartData = [
  { month: "Jan", users: 12 },
  { month: "Feb", users: 18 },
  { month: "Mar", users: 22 },
  { month: "Apr", users: 30 },
  { month: "May", users: 34 },
  { month: "Jun", users: 40 },
];

const AdminDashboard = () => {
  const [search, setSearch] = useState("");
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "Admin";


 const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(apiUrl("/api/auth/users"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [token]);

  const totalUsers = users.length;


  return (
    <div className="admin-dashboard">

      {/* Header */}
       <div className="admin-header-card">
        <h2 className="admin-title">
          <FaUserShield /> Welcome <span className="highlight">{userName.toUpperCase()}</span>
        </h2>
        <p className="admin-subtitle">
         Role: <strong>{userRole.toUpperCase()}</strong>  — Control, manage and monitor your organization efficiently ⚡
        </p>
      </div>

      {/* Controls */}
      <div className="admin-controls">
        <input
          type="text"
          className="admin-search"
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="admin-select"
          type="text"
          placeholder="Search deals or client..."
        >
          <option value="sales">Sales</option>
           <option value="admin">Admin</option>
              <option value="support">Support</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="digital_media">Digital Media</option>
        </select>

        <button className="btn-outline">📊 System Report</button>
      </div>

      {/* Metrics */}
      <div className="admin-metrics">
        <div className="metric-card">
          <div className="metric-label">Total Users</div>
          <div className="metric-value">{totalUsers}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Users</div>
          <div className="metric-value">56</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Inactive Users</div>
          <div className="metric-value">40%</div>
        </div>
      </div>

      {/* Chart */}
      <div className="admin-charts">
        <h3>User Growth Overview</h3>

        <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="professionalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4dabf7" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.5} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="month" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.1)" }} />

        <Bar
          dataKey="users"
          fill="url(#professionalGradient)"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
      </div>


    </div>
  );
};

export default AdminDashboard;