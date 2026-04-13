import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { FaUser, FaTicketAlt, FaCheckSquare, FaFilter } from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const TASK_COLORS = {
  pending: "#ff8a00",
  in_progress: "#38bdf8",
  completed: "#22c55e",
  reviewed: "#a78bfa",
};

const TICKET_COLORS = {
  open: "#ff8a00",
  "in-progress": "#38bdf8",
  resolved: "#22c55e",
  closed: "#a78bfa",
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const ManagementDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    leads: [],
    tasks: [],
    tickets: [],
  });
  const userName = localStorage.getItem("userName") || "User";
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [leadsRes, tasksRes, ticketsRes] = await Promise.all([
          axios.get(apiUrl("/api/leads?limit=100"), { headers }),
          axios.get(apiUrl("/api/tasks/my-tasks"), { headers }),
          axios.get(apiUrl("/api/tickets"), { headers }),
        ]);

        const allLeads = leadsRes.data?.data || [];
        const myLeads = allLeads.filter((lead) => {
          const createdById = lead.createdBy?._id || lead.createdBy;
          const assignedToId = lead.assignedTo?._id || lead.assignedTo;
          return String(createdById || "") === String(userId || "") || String(assignedToId || "") === String(userId || "");
        });

        setDashboardData({
          leads: myLeads,
          tasks: tasksRes.data?.data || [],
          tickets: ticketsRes.data?.data || [],
        });
      } catch (err) {
        setDashboardData({ leads: [], tasks: [], tickets: [] });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [token, userId]);

  const stats = useMemo(
    () => ({
      leads: dashboardData.leads.length,
      tasks: dashboardData.tasks.length,
      tickets: dashboardData.tickets.length,
      activeTasks: dashboardData.tasks.filter((task) => task.status === "in_progress").length,
    }),
    [dashboardData]
  );

  const taskStatusData = useMemo(() => {
    const grouped = dashboardData.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      color: TASK_COLORS[name] || "#64748b",
    }));
  }, [dashboardData.tasks]);

  const ticketStatusData = useMemo(() => {
    const grouped = dashboardData.tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      count: value,
      fill: TICKET_COLORS[name] || "#64748b",
    }));
  }, [dashboardData.tickets]);

  const recentTasks = useMemo(
    () => [...dashboardData.tasks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4),
    [dashboardData.tasks]
  );

  const recentTickets = useMemo(
    () => [...dashboardData.tickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4),
    [dashboardData.tickets]
  );

  const ticketPriorityData = useMemo(() => {
    const priorityColors = {
      low: "#94a3b8",
      medium: "#f59e0b",
      high: "#fb7185",
      urgent: "#ef4444",
    };

    const grouped = dashboardData.tickets.reduce((acc, ticket) => {
      const priority = (ticket.priority || "medium").toLowerCase();
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return ["low", "medium", "high", "urgent"].map((name) => ({
      name,
      total: grouped[name] || 0,
      fill: priorityColors[name],
    }));
  }, [dashboardData.tickets]);

  const workPulseData = useMemo(() => {
    const totals = {
      Leads: dashboardData.leads.length,
      Tasks: dashboardData.tasks.length,
      Tickets: dashboardData.tickets.length,
      Active: dashboardData.tasks.filter((task) => task.status === "in_progress").length,
      Closed: dashboardData.tickets.filter((ticket) => ["resolved", "closed"].includes(ticket.status)).length,
    };

    return Object.entries(totals).map(([label, value]) => ({ label, value }));
  }, [dashboardData]);

  return (
    <div className="admin-dashboard management-view">
      <div className="admin-hero">
        <div className="admin-hero-left">
          <div className="admin-badge netcradus-badge">
            <FaUser />
            <span>NETCRADUS Management Panel</span>
          </div>
          <h1>
            Hello, <span>{userName}</span>
          </h1>
          <p>Track your live leads, assigned tasks, support tickets, and daily progress from one workspace.</p>
        </div>
        <div className="admin-hero-right">
          <AttendanceWidget />
        </div>
      </div>

      <div className="management-stats-grid admin-metrics">
        <div className="stat-card glass metric-card gradient-1" onClick={() => navigate("/leads")}>
          <div className="stat-icon metric-icon"><FaUser /></div>
          <div className="stat-info">
            <h3 className="metric-value">{stats.leads}</h3>
            <p className="metric-label">My Leads</p>
          </div>
        </div>
        <div className="stat-card glass metric-card gradient-2" onClick={() => navigate("/tasks")}>
          <div className="stat-icon metric-icon"><FaCheckSquare /></div>
          <div className="stat-info">
            <h3 className="metric-value">{stats.tasks}</h3>
            <p className="metric-label">My Tasks</p>
          </div>
        </div>
        <div className="stat-card glass metric-card gradient-3" onClick={() => navigate("/tickets")}>
          <div className="stat-icon metric-icon"><FaTicketAlt /></div>
          <div className="stat-info">
            <h3 className="metric-value">{stats.tickets}</h3>
            <p className="metric-label">Support Tickets</p>
          </div>
        </div>
        <div className="stat-card glass metric-card" onClick={() => navigate("/tasks")}>
          <div className="stat-icon metric-icon"><FaFilter /></div>
          <div className="stat-info">
            <h3 className="metric-value">{stats.activeTasks}</h3>
            <p className="metric-label">Active Tasks</p>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>Ticket Status Snapshot</h3>
            <span className="chip">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ticketStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                {ticketStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-side glass netcradus-panel">
          <div className="card-header">
            <h3>Task Breakdown</h3>
            <span className="chip">Today</span>
          </div>
          <div className="pie-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {taskStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="insight-list">
            <li>
              <span>Open Tickets</span>
              <strong>{dashboardData.tickets.filter((ticket) => ticket.status === "open").length}</strong>
            </li>
            <li>
              <span>In Progress Tasks</span>
              <strong>{dashboardData.tasks.filter((task) => task.status === "in_progress").length}</strong>
            </li>
            <li>
              <span>Completed Tasks</span>
              <strong>{dashboardData.tasks.filter((task) => ["completed", "reviewed"].includes(task.status)).length}</strong>
            </li>
            <li>
              <span>Recent Leads</span>
              <strong>{dashboardData.leads.slice(0, 5).length}</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="admin-grid" style={{ marginTop: "20px" }}>
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>Ticket Priority Snapshot</h3>
            <span className="chip">Live tickets</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketPriorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                {ticketPriorityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-side glass netcradus-panel">
          <div className="card-header">
            <h3>Work Pulse</h3>
            <span className="chip">Realtime</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={workPulseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="label" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ff5f3d"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ff8a00" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-grid" style={{ marginTop: "20px" }}>
        <div className="admin-charts glass netcradus-panel">
          <div className="card-header">
            <h3>Recent Tasks</h3>
            <span className="chip">Latest 4</span>
          </div>
          <ul className="insight-list">
            {recentTasks.length ? (
              recentTasks.map((task) => (
                <li key={task._id}>
                  <span>{task.title}</span>
                  <strong>{formatDate(task.dueDate)}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>No recent tasks</span>
                <strong>--</strong>
              </li>
            )}
          </ul>
        </div>

        <div className="admin-side glass netcradus-panel">
          <div className="card-header">
            <h3>Recent Tickets</h3>
            <span className="chip">Latest 4</span>
          </div>
          <ul className="insight-list">
            {recentTickets.length ? (
              recentTickets.map((ticket) => (
                <li key={ticket._id}>
                  <span>{ticket.ticketId} - {ticket.title}</span>
                  <strong>{ticket.status}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>No recent tickets</span>
                <strong>--</strong>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
