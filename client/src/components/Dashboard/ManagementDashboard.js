import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { FaUser, FaTicketAlt, FaClock, FaCheckSquare } from "react-icons/fa";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css"; // Reuse styling base

const ManagementDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ leads: 0, tasks: 0, tickets: 0 });
  const userName = localStorage.getItem("userName") || "User";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [leadsRes, tasksRes, ticketsRes] = await Promise.all([
          axios.get(apiUrl("/api/leads"), { headers }),
          axios.get(apiUrl("/api/tasks"), { headers }),
          axios.get(apiUrl("/api/tickets"), { headers })
        ]);
        setStats({
          leads: leadsRes.data.length || 0,
          tasks: tasksRes.data.length || 0,
          tickets: ticketsRes.data.data?.length || 0
        });
      } catch (err) {
        console.error("Error fetching management stats:", err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="admin-dashboard management-view">
      <div className="admin-hero">
        <div className="admin-hero-left">
          <div className="admin-badge netcradus-badge">
            <FaUser />
            <span>NETCRADUS Management Panel</span>
          </div>
          <h1>Hello, <span>{userName}</span></h1>
          <p>Welcome to your personal workspace. Track your leads, tasks, and attendance below.</p>
        </div>
        <div className="admin-hero-right">
          <AttendanceWidget />
        </div>
      </div>

      <div className="management-stats-grid">
         <div className="stat-card glass" onClick={() => navigate("/leads")}>
            <div className="stat-icon"><FaUser /></div>
            <div className="stat-info">
                <h3>{stats.leads}</h3>
                <p>My Leads</p>
            </div>
         </div>
         <div className="stat-card glass" onClick={() => navigate("/tasks")}>
            <div className="stat-icon"><FaCheckSquare /></div>
            <div className="stat-info">
                <h3>{stats.tasks}</h3>
                <p>Pending Tasks</p>
            </div>
         </div>
         <div className="stat-card glass" onClick={() => navigate("/tickets")}>
            <div className="stat-icon"><FaTicketAlt /></div>
            <div className="stat-info">
                <h3>{stats.tickets}</h3>
                <p>Support Tickets</p>
            </div>
         </div>
         <div className="stat-card glass action" onClick={() => navigate("/tickets")}>
            <div className="stat-icon"><FaTicketAlt /></div>
            <div className="stat-info">
                <h3>New Ticket</h3>
                <p>Get help from IT/Admin</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
