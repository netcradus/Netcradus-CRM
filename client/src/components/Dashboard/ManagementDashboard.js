import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
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

const DASHBOARD_REFRESH_MS = 300000;
const DASHBOARD_REQUEST_TIMEOUT_MS = 10000;

const TASK_COLORS = {
  pending: "var(--color-warning)",
  in_progress: "var(--color-accent)",
  completed: "var(--color-success)",
  reviewed: "var(--color-info)",
  approved: "var(--color-success)",
};

const TICKET_COLORS = {
  open: "var(--color-warning)",
  "in-progress": "var(--color-accent)",
  resolved: "var(--color-success)",
  closed: "var(--color-text-muted)",
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
    selfTasks: [],
    tickets: [],
  });
  const userName = localStorage.getItem("userName") || "User";
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [leadsRes, tasksRes, selfTasksRes, ticketsRes] = await Promise.all([
          axios.get(apiUrl("/api/leads?limit=100"), { headers, timeout: DASHBOARD_REQUEST_TIMEOUT_MS }),
          axios.get(apiUrl("/api/tasks/my-tasks"), { headers, timeout: DASHBOARD_REQUEST_TIMEOUT_MS }),
          axios.get(apiUrl("/api/tasks/self/mine?status=approved"), { headers, timeout: DASHBOARD_REQUEST_TIMEOUT_MS }),
          axios.get(apiUrl("/api/tickets"), { headers, timeout: DASHBOARD_REQUEST_TIMEOUT_MS }),
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
          selfTasks: selfTasksRes.data?.tasks || [],
          tickets: ticketsRes.data?.data || [],
        });
      } catch (err) {
        setDashboardData({ leads: [], tasks: [], selfTasks: [], tickets: [] });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, DASHBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, [token, userId]);

  const stats = useMemo(
    () => ({
      leads: dashboardData.leads.length,
      tasks: dashboardData.tasks.length,
      completedTasks: dashboardData.tasks.filter((task) => ["completed", "reviewed"].includes(task.status)).length + dashboardData.selfTasks.length,
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
    grouped.approved = (grouped.approved || 0) + dashboardData.selfTasks.length;

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      color: TASK_COLORS[name] || "var(--color-bg-elevated)",
    }));
  }, [dashboardData.selfTasks.length, dashboardData.tasks]);

  const ticketStatusData = useMemo(() => {
    const grouped = dashboardData.tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      count: value,
      fill: TICKET_COLORS[name] || "var(--color-bg-elevated)",
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

  const workPulseData = useMemo(() => {
    const totals = {
      Leads: dashboardData.leads.length,
      Tasks: dashboardData.tasks.length,
      Completed: dashboardData.tasks.filter((task) => ["completed", "reviewed"].includes(task.status)).length + dashboardData.selfTasks.length,
      Tickets: dashboardData.tickets.length,
      Active: dashboardData.tasks.filter((task) => task.status === "in_progress").length,
    };
    return Object.entries(totals).map(([label, value]) => ({ label, value }));
  }, [dashboardData]);

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Management Dashboard</h1>
          <p className="subtitle">Performance metrics and operations workspace.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card" onClick={() => navigate("/leads")} style={{ cursor: 'pointer' }}>
          <span className="metric-label">My Leads</span>
          <span className="metric-value">{stats.leads}</span>
        </div>
        <div className="nc-stat-card" onClick={() => navigate("/tasks")} style={{ cursor: 'pointer' }}>
          <span className="metric-label">My Tasks</span>
          <span className="metric-value">{stats.tasks}</span>
        </div>
        <div className="nc-stat-card" onClick={() => navigate("/tickets")} style={{ cursor: 'pointer' }}>
          <span className="metric-label">Support Tickets</span>
          <span className="metric-value">{stats.tickets}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Tasks</span>
          <span className="metric-value" style={{ color: 'var(--color-accent)' }}>{stats.activeTasks}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Completed Tasks</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{stats.completedTasks}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Ticket Status Snapshot</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ticketStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ticketStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Task Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {taskStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'center' }}>
            {taskStatusData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Work Pulse</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={workPulseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Shift Status</h3>
          <AttendanceWidget />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Recent Tasks</h3>
          <table className="nc-table">
            <thead>
              <tr><th>Title</th><th>Due Date</th></tr>
            </thead>
            <tbody>
              {recentTasks.map(task => (
                <tr key={task._id}>
                  <td>{task.title}</td>
                  <td>{formatDate(task.dueDate)}</td>
                </tr>
              ))}
              {recentTasks.length === 0 && <tr><td colSpan="2" style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>No recent tasks</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Recent Tickets</h3>
          <table className="nc-table">
            <thead>
              <tr><th>ID</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentTickets.map(ticket => (
                <tr key={ticket._id}>
                  <td>{ticket.ticketId}</td>
                  <td>
                    <span className={`badge badge-${ticket.status === 'resolved' ? 'success' : 'warning'}`}>
                      {ticket.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && <tr><td colSpan="2" style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>No recent tickets</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
