import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import './SalesDashboard.css';

const chartData = [
  { month: 'Jan', deals: 12 },
  { month: 'Feb', deals: 19 },
  { month: 'Mar', deals: 25 },
  { month: 'Apr', deals: 18 },
  { month: 'May', deals: 22 },
  { month: 'Jun', deals: 28 },
  { month: 'Jul', deals: 32 },
  { month: 'Aug', deals: 26 },
];


const SalesDashboard = () => {
  const [search, setSearch] = useState("");
  return (
    <div className="sales-dashboard">
      <div className="sales-header-card">
        <h2 className="sales-title">
          Welcome <span className="highlight">SALES TEAM</span>
        </h2>
        <p className="sales-subtitle">
          Empowering your sales momentum with actionable insights 🚀
        </p>
      </div>

      <div className="sales-controls">
        <input
          className="sales-search"
          type="text"
          placeholder="Search deals or client..."
        />
        <select className="sales-select">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <button className="btn-primary">+ Add New Deal</button>
        <button className="btn-outline">📥 Export Report</button>
        <button className="btn-outline">📊 Review Reports</button>
        <button className="btn-outline">👥 Manage Roles</button>
        <button className="btn-outline">✅ Approve Requests</button>
      </div>

      <div className="sales-metrics">
        <div className="metric-card">
          <div className="metric-label">Open Deals</div>
          <div className="metric-value">27</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue (This Month)</div>
          <div className="metric-value">$42,500</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">32%</div>
        </div>
      </div>

      <div className="sales-charts">
        <h3 className="chart-heading">Monthly Performance Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#444"/>
            <YAxis stroke="#e4e3f4ff" />
            <Tooltip />
            <defs>
              <linearGradient id="pinkPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff80ab" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#b388ff" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Bar dataKey="deals" fill="url(#pinkPurpleGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesDashboard;
