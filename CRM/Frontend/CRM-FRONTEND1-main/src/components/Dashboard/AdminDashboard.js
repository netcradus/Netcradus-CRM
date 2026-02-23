import React, { useState, useMemo } from "react";
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

  return (
    <div className="admin-dashboard">

      {/* Header */}
      <div className="admin-header-card">
        <h2 className="admin-title">
          <FaUserShield /> Welcome <span className="highlight">ADMIN</span>
        </h2>
        <p className="admin-subtitle">
          Control, manage and monitor your organization efficiently ⚡
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
          <option value="">All Roles</option>
          <option value="sales">Sales</option>
          <option value="support">Support</option>
          <option value="hr">HR</option>
        </select>

        <button className="btn-primary">+ Add User</button>
        <button className="btn-outline">📊 System Report</button>
      </div>

      {/* Metrics */}
      <div className="admin-metrics">
        <div className="metric-card">
          <div className="metric-label">Total Users</div>
          <div className="metric-value">120</div>
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
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip />

            <defs>
              <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff80ab" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#b388ff" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <Bar
              dataKey="users"
              fill="url(#adminGradient)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>


    </div>
  );
};

export default AdminDashboard;