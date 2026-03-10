import React, { useState } from 'react';
import { FaSearch, FaUserCircle, FaUsers, FaBriefcase, FaExchangeAlt, FaUmbrellaBeach } from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './HRDashboard.css';

// Employee Headcount Trend Data
const headcountData = [
  { month: 'Nov 2022', count: 1150, growth: null },
  { month: 'Dec 2022', count: 1170, growth: null },
  { month: 'Jan 2023', count: 1180, growth: null },
  { month: 'Mar 2023', count: 1190, growth: null },
  { month: 'Apr 2023', count: 1190, growth: null },
  { month: 'May 2023', count: 1200, growth: null },
  { month: 'Jun 2023', count: 1220, growth: '1250', date: 'June 26, 2023' },
  { month: 'Jul 2023', count: 1200, growth: null },
  { month: 'Aug 2023', count: 1220, growth: null },
  { month: 'Sep 2023', count: 1200, growth: null },
  { month: 'Oct 2023', count: 1250, growth: null },
];

// Department Distribution Data
const departmentData = [
  { name: 'Sales', value: 28, color: '#4A90E2' },
  { name: 'Engineering', value: 24, color: '#50C878' },
  { name: 'Marketing', value: 18, color: '#F39C12' },
  { name: 'Support', value: 10, color: '#9B59B6' },
  { name: 'HR', value: 20, color: '#1ABC9C' },
];

// Recent Leave Requests Data
const leaveRequests = [
  {
    id: 1,
    photo: '👤',
    name: 'Sarah Jenkins',
    dept: 'HR',
    requestDate: '09/10/2023',
    leaveType: 'Leave Type',
    dates: 'Dec 10 - Dec 25',
    status: 'Approved',
  },
  {
    id: 2,
    photo: '👤',
    name: 'Sarah Jenkins',
    dept: 'Engineer',
    requestDate: '09/01/2023',
    leaveType: 'Leave Typicit',
    dates: 'Dec 18 - Dec 26',
    status: 'Pending',
  },
  {
    id: 3,
    photo: '👤',
    name: 'Sarah Jenkins',
    dept: 'Dept.',
    requestDate: '09/01/2023',
    leaveType: 'Leave Type',
    dates: 'Dec 18 - Dec 23',
    status: 'Rejected',
  },
];

// Work Anniversaries
const anniversaries = [
  { name: 'Sarah Jenkins', date: '06/10/2023', dept: 'Sales' },
  { name: 'Sarah Jenkins', date: '06/10/2023', dept: 'Depts' },
];

// Quick Access Tasks
const quickTasks = [
  { icon: '📋', text: 'Review Candidate Profiles' },
  { icon: '💰', text: 'Complete Payroll' },
  { icon: '📝', text: 'Update Policies' },
];

const HRDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Monthly growth');

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Pending':
        return 'status-pending';
      case 'Rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  return (
    <div className="hr-dashboard">
      {/* Header */}
      <div className="hr-header">
        <h1 className="hr-title">
          Human Resources Dashboard 
        </h1>
        <div className="header-right">
          <span className="header-date">October 26, 2023</span>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="user-profile">
            <FaUserCircle size={32} />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#E3F2FD' }}>
            <FaUsers style={{ color: '#2196F3' }} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Employees</div>
            <div className="metric-value">
              1,250 <span className="metric-change positive">↑ +3%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#E8F5E9' }}>
            <FaBriefcase style={{ color: '#4CAF50' }} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Open Positions</div>
            <div className="metric-value">
              45 <span className="metric-subtext">12 new this month</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#FFF3E0' }}>
            <FaExchangeAlt style={{ color: '#FF9800' }} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Employee Turnover</div>
            <div className="metric-value">
              4.8% <span className="metric-change negative">-1.1%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#F3E5F5' }}>
            <FaUmbrellaBeach style={{ color: '#9C27B0' }} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Pending Leave Requests</div>
            <div className="metric-value">
              68 <span className="metric-subtext">25 awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Employee Headcount Trend */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Employee Headcount Trend (Last 12 Months)</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="chart-select"
            >
              <option>Monthly growth</option>
              <option>Quarterly growth</option>
              <option>Yearly growth</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={headcountData}>
              <defs>
                <linearGradient id="headcountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4A90E2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} domain={[1100, 1300]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2C3E50',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4A90E2"
                strokeWidth={3}
                dot={{ fill: '#4A90E2', r: 5 }}
                activeDot={{ r: 8 }}
                fill="url(#headcountGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Department Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {departmentData.map((dept, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: dept.color }}></div>
                <span className="legend-label">{dept.name}</span>
                <span className="legend-value">{dept.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Recent Leave Requests */}
        <div className="table-card">
          <h3 className="table-title">Recent Leave Requests</h3>
          <div className="table-wrapper">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Request Date</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Photo">
                      <div className="photo-circle">{request.photo}</div>
                    </td>
                    <td data-label="Name">{request.name}</td>
                    <td data-label="Dept">{request.dept}</td>
                    <td data-label="Request Date">{request.requestDate}</td>
                    <td data-label="Leave Type">{request.leaveType}</td>
                    <td data-label="Dates">{request.dates}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${getStatusClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <button className="action-btn">View/Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="sidebar-cards">
          {/* Work Anniversaries */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">Upcoming Work Anniversaries</h3>
            <div className="anniversary-list">
              <div className="anniversary-header">
                <span>Names</span>
                <span>Dates</span>
                <span>Depts</span>
              </div>
              {anniversaries.map((person, index) => (
                <div key={index} className="anniversary-item">
                  <span>{person.name}</span>
                  <span>{person.date}</span>
                  <span>{person.dept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access Tasks */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">Quick Access Tasks</h3>
            <div className="quick-tasks">
              {quickTasks.map((task, index) => (
                <div key={index} className="task-item">
                  <span className="task-icon">{task.icon}</span>
                  <span className="task-text">{task.text}</span>
                  <span className="task-arrow">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;