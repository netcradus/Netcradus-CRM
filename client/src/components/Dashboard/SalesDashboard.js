import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  Plus,
  Download,
  BarChart3,
  Users,
  CheckCircle2,
  BadgeDollarSign,
  CircleDashed,
  BriefcaseBusiness,
} from 'lucide-react';
import AttendanceWidget from '../../features/Attendance/AttendanceWidget';

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

const pipelineData = [
  { name: 'Open', value: 42, color: '#ff8a00' },
  { name: 'Won', value: 36, color: '#ff5f3d' },
  { name: 'Lost', value: 22, color: '#ff2d8f' },
];

const recentDeals = [
  { id: 1, client: 'Acme Corp', owner: 'A. Sharma', value: '$8,500', status: 'open' },
  { id: 2, client: 'Pixel Nova', owner: 'R. Singh', value: '$14,200', status: 'won' },
  { id: 3, client: 'Vertex Labs', owner: 'S. Khan', value: '$5,900', status: 'lost' },
  { id: 4, client: 'Blue Peak', owner: 'N. Roy', value: '$11,400', status: 'open' },
];

const pieColors = ['#ff8a00', '#ff5f3d', '#ff2d8f'];

const SalesDashboard = ({ preview }) => {
  const [search, setSearch] = useState('');
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'Admin';

  return (
    <div className="sales-dashboard">
      <div className="sales-hero">
        <div className="sales-hero-left">
          <div className="sales-badge">
            <TrendingUp size={14} />
            <span>NETCRADUS SALES COMMAND CENTER</span>
          </div>
          <h1 className="sales-title">Welcome, <span>{userName}</span></h1>
          <p className="sales-subtitle">
            Role: <strong>{userRole}</strong> — Empowering your sales momentum with actionable insights, pipeline visibility and performance tracking.
          </p>
        </div>

        <div className="sales-hero-status">
          <div className="live-dot" />
          <span>Sales System Active</span>
          <div style={{ marginTop: '12px' }}>
            <AttendanceWidget />
          </div>
        </div>
      </div>

      <div className="sales-controls glass-panel">
        <div className="sales-search-wrap">
          <Search size={16} className="sales-search-icon" />
          <input
            className="sales-search"
            type="text"
            placeholder="Search deals or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="sales-select">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <button className="btn-primary sales-btn-primary">
          <Plus size={16} />
          <span>Add New Deal</span>
        </button>

        <button className="btn-outline">
          <Download size={16} />
          <span>Export Report</span>
        </button>

        <button className="btn-outline">
          <BarChart3 size={16} />
          <span>Review Reports</span>
        </button>

        <button className="btn-outline">
          <Users size={16} />
          <span>Manage Roles</span>
        </button>

        <button className="btn-outline">
          <CheckCircle2 size={16} />
          <span>Approve Requests</span>
        </button>
      </div>

      <div className="sales-metrics">
        <div className="metric-card gradient-orange">
          <div className="metric-icon metric-orange">
            <CircleDashed size={22} />
          </div>
          <div>
            <div className="metric-label">Open Deals</div>
            <div className="metric-value">27</div>
          </div>
        </div>

        <div className="metric-card gradient-coral">
          <div className="metric-icon metric-coral">
            <BadgeDollarSign size={22} />
          </div>
          <div>
            <div className="metric-label">Revenue (This Month)</div>
            <div className="metric-value">$42,500</div>
          </div>
        </div>

        <div className="metric-card gradient-pink">
          <div className="metric-icon metric-pink">
            <BriefcaseBusiness size={22} />
          </div>
          <div>
            <div className="metric-label">Conversion Rate</div>
            <div className="metric-value">32%</div>
          </div>
        </div>
      </div>

      <div className="sales-grid">
        <div className="sales-charts net-panel">
          <div className="section-header">
            <h3 className="chart-heading">Monthly Performance Overview</h3>
            <span className="mini-chip">Last 8 Months</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="salesBarGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff8a00" stopOpacity={0.95} />
                  <stop offset="50%" stopColor="#ff5f3d" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#ff2d8f" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="#b7b7b7" />
              <YAxis stroke="#d4d4d4" />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  background: '#111116',
                  border: '1px solid rgba(255, 138, 0, 0.18)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="deals" fill="url(#salesBarGradient)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sales-side net-panel">
          <div className="section-header">
            <h3>Pipeline Distribution</h3>
            <span className="mini-chip">Live Split</span>
          </div>

          <div className="pie-wrap">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#111116',
                    border: '1px solid rgba(255, 138, 0, 0.18)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sales-legend">
            {pipelineData.map((item) => (
              <div className="legend-item" key={item.name}>
                <span className="legend-color" style={{ background: item.color }} />
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sales-list net-panel">
        <div className="section-header">
          <h3>Recent Deals</h3>
          <button className="btn-outline compact-btn">
            <BarChart3 size={15} />
            <span>View All</span>
          </button>
        </div>

        <div className="deal-list-wrap">
          {recentDeals.map((deal) => (
            <div className="deal-item" key={deal.id}>
              <div className="deal-main">
                <div className="deal-client">{deal.client}</div>
                <div className="deal-owner">Owner: {deal.owner}</div>
              </div>
              <div className="deal-value">{deal.value}</div>
              <span className={`status ${deal.status}`}>{deal.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
