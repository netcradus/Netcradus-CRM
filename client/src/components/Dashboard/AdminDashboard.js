import React, { useState, useEffect, useRef } from "react";
import { FileBarChart } from "lucide-react";
import { FaUserShield, FaUsers, FaUserCheck, FaUserTimes } from "react-icons/fa";
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
  Legend,
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

const chartData = [
  { month: "Jan", users: 12 },
  { month: "Feb", users: 18 },
  { month: "Mar", users: 22 },
  { month: "Apr", users: 30 },
  { month: "May", users: 34 },
  { month: "Jun", users: 40 },
];

const pieData = [
  { name: "Support", value: 24 },
  { name: "HR", value: 12 },
  { name: "IT", value: 20 },
  { name: "Sales", value: 26 },
];

// Colors inspired by NETCRADUS logo (orange → pink gradient)
const PIE_COLORS = [
  "#ff7a18", // orange
  "#ff5f3d",
  "#ff3f6c",
  "#ff2d8f", // pink
  "#ff8a00",
];

const AdminDashboard = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
const previewRef = useRef(null);
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

  const totalUsers = users.length;
const [selectedRole, setSelectedRole] = useState("");
const [selectedUser, setSelectedUser] = useState(null);

const handleRoleChange = (e) => {
  const role = e.target.value;
  setSelectedRole(role);
  setSelectedUser(null); // reset user
};

const handleSearch = () => {
  const searchValue = search.toLowerCase().trim();

  const foundUser = users.find(
    (u) =>
      u.name.toLowerCase().includes(searchValue) ||
      u.email.toLowerCase().includes(searchValue) ||
      u.role.toLowerCase().includes(searchValue)
  );

  console.log("FOUND USER 👉", foundUser);

  if (foundUser) {
    setSelectedUser(foundUser);
    setSelectedRole(foundUser.role);
  } else {
    alert("User not found ❌");
  }
};

const renderSelectedDashboard = () => {
  const role = selectedUser ? selectedUser.role : selectedRole;

  console.log("ROLE 👉", role);

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
useEffect(() => {
  if (previewRef.current) {
    previewRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [selectedRole, selectedUser]);
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
            Role: <strong>{userRole}</strong> — Monitor users, analytics and system
            performance in real time.
          </p>
        </div>

        <div className="admin-hero-right netcradus-status">
          <div className="live-dot" />
          <span>NETCRADUS System Active</span>
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

       <select className="admin-select" onChange={handleRoleChange}>
  <option value="">Select Role</option>
  <option value="sales">Sales</option>
  <option value="support">Support</option>
  <option value="hr">HR</option>
  <option value="it">IT</option>
  <option value="digital_media">Digital Media</option>
</select>

        <button className="btn-primary netcradus-btn">
          <FileBarChart size={18} />
          Generate Report
        </button>
      </div>

      <div className="admin-metrics">
        <div className="metric-card gradient-1 netcradus-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div>
            <div className="metric-label">Total Users</div>
            <div className="metric-value">{totalUsers}</div>
          </div>
        </div>

        <div className="metric-card gradient-2 netcradus-card">
          <div className="metric-icon">
            <FaUserCheck />
          </div>
          <div>
            <div className="metric-label">Active Users</div>
            <div className="metric-value">56</div>
          </div>
        </div>

        <div className="metric-card gradient-3 netcradus-card">
          <div className="metric-icon">
            <FaUserTimes />
          </div>
          <div>
            <div className="metric-label">Inactive Users</div>
            <div className="metric-value">40%</div>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>User Growth Overview</h3>
            <span className="chip">Last 6 Months</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
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
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                contentStyle={{
                  background: "#111116",
                  border: "1px solid rgba(255, 138, 0, 0.18)",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="users" fill="url(#barGrad)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-side glass netcradus-panel">
          <div className="card-header">
            <h3>User Roles</h3>
            <span className="chip">Distribution</span>
          </div>

          <div className="pie-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
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
              <span>Total Users</span>
              <strong>{totalUsers}</strong>
            </li>
            <li>
              <span>Active Ratio</span>
              <strong>60%</strong>
            </li>
            <li>
              <span>New This Month</span>
              <strong>+128</strong>
            </li>
            <li>
              <span>System Health</span>
              <strong className="good">Good</strong>
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
