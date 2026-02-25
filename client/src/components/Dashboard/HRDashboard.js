import React from 'react';
import { FaPeopleCarry } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import './HRDashboard.css';

const chartData = [
  { month: 'Jan', hires: 5 },
  { month: 'Feb', hires: 8 },
  { month: 'Mar', hires: 12 },
  { month: 'Apr', hires: 9 },
  { month: 'May', hires: 14 },
  { month: 'Jun', hires: 11 },
  { month: 'Jul', hires: 7 },
  { month: 'Aug', hires: 10 },
];

const HRDashboard = () => {
  return (
    <div className="hr-dashboard">
      <div className="hr-header-card">
        <h2 className="hr-title">
          <FaPeopleCarry /> Welcome <span className="highlight">HR TEAM</span>
        </h2>
        <p className="hr-subtitle">
          Streamlining your workforce management and employee engagement 💼
        </p>
      </div>

      <div className="hr-controls">
        <input
          className="hr-search"
          type="text"
          placeholder="Search employees or requests..."
        />
        <select className="hr-select">
          <option value="">All Requests</option>
          <option value="leave">Leave</option>
          <option value="hiring">Hiring</option>
          <option value="complaints">Complaints</option>
        </select>
        <button className="btn-primary">+ Add New Employee</button>
        <button className="btn-outline">📥 Export Data</button>
        <button className="btn-outline">📄 View Reports</button>
        <button className="btn-outline">🛡️ Manage Policies</button>
        <button className="btn-outline">✅ Approve Leaves</button>
      </div>

      <div className="hr-metrics">
        <div className="metric-card">
          <div className="metric-label">Total Employees</div>
          <div className="metric-value">145</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Leave Requests</div>
          <div className="metric-value">13</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Open Complaints</div>
          <div className="metric-value">4</div>
        </div>
      </div>

      <div className="hr-charts">
        <h3 className="chart-heading">Monthly Hiring Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#444"/>
            <YAxis stroke="#e4e3f4ff" />
            <Tooltip />
            <defs>
              <linearGradient id="blueGreenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00c6ff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#0072ff" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Bar dataKey="hires" fill="url(#blueGreenGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HRDashboard;
