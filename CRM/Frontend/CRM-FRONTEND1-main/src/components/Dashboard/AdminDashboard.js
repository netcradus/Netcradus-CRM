// import React from "react";
// import Chart from "./Chart";
// import Sidebar from "./Sidebar";
// import "./AdminDashboard.css";

// import "./AdminDashboard.css";

// function AdminDashboard() {
//   return (
//     <div className="dashboard-container">
//       <Sidebar />
//       <div className="dashboard">
//         <h2>Welcome, Admin 👑</h2>
//         <div className="top-cards">
//           <div className="card"><p>Total Users</p><strong>350</strong></div>
//           <div className="card"><p>Active Tickets</p><strong>87</strong></div>
//           <div className="card"><p>Reports</p><strong>18</strong></div>
//         </div>
//         <div className="chart-tasks">
//           <div className="card chart"><Chart /></div>
//           <div className="card tasks">
//             <p><strong>Admin Tasks</strong></p>
//             <ul>
//               <li>Review reports</li>
//               <li>Manage roles</li>
//               <li>Approve requests</li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;



// import React from "react";
// import Sidebar from "./Sidebar";
// import Chart from "./Chart";
// import "./AdminDashboard.css";

// function AdminDashboard() {
//   return (
//     <div className="dashboard-container">
//       <Sidebar />
//       <div className="dashboard-content">
//         <h2>Welcome, Admin 👑</h2>
//         <div className="top-cards">
//           <div className="card"><p>Total Users</p><strong>350</strong></div>
//           <div className="card"><p>Active Tickets</p><strong>87</strong></div>
//           <div className="card"><p>Reports</p><strong>18</strong></div>
//         </div>
//         <div className="chart-tasks">
//           <div className="card chart"><Chart /></div>
//           <div className="card tasks">
//             <p><strong>Admin Tasks</strong></p>
//             <ul>
//               <li>Review reports</li>
//               <li>Manage roles</li>
//               <li>Approve requests</li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;
   


// import React from "react";
// import Chart from "./Chart";
// import "./AdminDashboard.css";

// function AdminDashboard() {
//   return (
//     <div className="dashboard-content">
//       <h2>Welcome, Admin 👑</h2>
//       <div className="top-cards">
//         <div className="card"><p>Total Users</p><strong>350</strong></div>
//         <div className="card"><p>Active Tickets</p><strong>87</strong></div>
//         <div className="card"><p>Reports</p><strong>18</strong></div>
//       </div>
//       <div className="chart-tasks">
//         <div className="card chart"><Chart /></div>
//         <div className="card tasks">
//           <p><strong>Admin Tasks</strong></p>
//           <ul>
//             <li>Review reports</li>
//             <li>Manage roles</li>
//             <li>Approve requests</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;

// import React from "react";
// import Chart from "./Chart";
// import Sidebar from "../Dashboard/Sidebar"; // Make sure path is correct
// import "./AdminDashboard.css";

// function AdminDashboard() {
//   return (
//     <div className="dashboard-container">
//       <Sidebar />

//       <div className="crm-main-content">
//         <div className="dashboard-content">
//           <div className="welcome-banner">
//             <h2>Welcome, Admin 👑</h2>
//             <p className="subtitle">Manage everything from here</p>
//           </div>

//           <div className="admin-box">
//             {/* Top Summary Cards */}
//             <div className="top-cards">
//               <div className="card">
//                 <p>Total Users</p>
//                 <strong>350</strong>
//               </div>
//               <div className="card">
//                 <p>Active Tickets</p>
//                 <strong>87</strong>
//               </div>
//               <div className="card">
//                 <p>Reports</p>
//                 <strong>18</strong>
//               </div>
//             </div>

//             {/* Chart and Task Section */}
//             <div className="chart-tasks">
//               <div className="card chart" style={{ height: "320px" }}>
//                 <Chart />
//               </div>

//               <div className="card tasks">
//                 <p><strong>Admin Tasks</strong></p>
//                 <ul>
//                   <li>📊 Review reports</li>
//                   <li>🛠️ Manage roles</li>
//                   <li>✅ Approve requests</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;




import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import './AdminDashboard.css'; // Same CSS used for consistent styling

const chartData = [
  { month: 'Jan', users: 5 },
  { month: 'Feb', users: 9 },
  { month: 'Mar', users: 12 },
  { month: 'Apr', users: 8 },
  { month: 'May', users: 11 },
  { month: 'Jun', users: 15 },
  { month: 'Jul', users: 14 },
  { month: 'Aug', users: 17 },
];

const AdminDashboard = () => {
  return (
    <div className="sales-dashboard">
      <div className="sales-header-card">
        <h2 className="sales-title">
          Welcome <span className="highlight">ADMIN PANEL</span>
        </h2>
        <p className="sales-subtitle">
          Centralized control & user insights at your fingertips 🔧
        </p>
      </div>

      <div className="sales-controls">
        <input
          className="sales-search"
          type="text"
          placeholder="Search users or settings..."
        />
        <select className="sales-select">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="sales">Sales</option>
          <option value="support">Support</option>
        </select>
        <button className="btn-primary">+ Add New User</button>
        <button className="btn-outline">📥 Export Users</button>
        <button className="btn-outline">🔒 Manage Access</button>
        <button className="btn-outline">⚙️ Settings</button>
        <button className="btn-outline">📄 Audit Logs</button>
      </div>

      <div className="sales-metrics">
        <div className="metric-card">
          <div className="metric-label">Total Users</div>
          <div className="metric-value">124</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending Requests</div>
          <div className="metric-value">6</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Sessions</div>
          <div className="metric-value">22</div>
        </div>
      </div>

      <div className="sales-charts">
        <h3 className="chart-heading">User Growth Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#444"/>
            <YAxis stroke="#e4e3f4ff" />
            <Tooltip />
            <defs>
              <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4facfe" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00f2fe" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Bar dataKey="users" fill="url(#adminGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
