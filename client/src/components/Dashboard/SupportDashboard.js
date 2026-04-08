import React, { useEffect, useMemo, useState } from "react";
import { Headset, Search, Plus, Download, Clock3, Ticket, TimerReset, CircleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
} from "recharts";
import axios from "axios";
import "./SupportDashboard.css";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { apiUrl } from "../../config/api";

const STATUS_COLORS = {
  open: "#ff8a00",
  "in-progress": "#38bdf8",
  resolved: "#22c55e",
  closed: "#a78bfa",
};

const PRIORITY_COLORS = {
  low: "#94a3b8",
  medium: "#fbbf24",
  high: "#fb7185",
  urgent: "#ef4444",
};

const formatRoleLabel = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

function SupportDashboard({ preview }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "support";

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await axios.get(apiUrl("/api/tickets"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(data.data || []);
      } catch (error) {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
    const interval = setInterval(fetchTickets, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const filteredTickets = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      const matchesSearch =
        !searchValue ||
        [ticket.ticketId, ticket.title, ticket.category, ticket.priority, ticket.raisedBy?.name]
          .some((value) => String(value || "").toLowerCase().includes(searchValue));
      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, statusFilter, tickets]);

  const statusChartData = useMemo(() => {
    const counts = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || "#64748b",
    }));
  }, [filteredTickets]);

  const priorityChartData = useMemo(() => {
    const counts = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    return ["low", "medium", "high", "urgent"].map((level) => ({
      name: level,
      value: counts[level] || 0,
      color: PRIORITY_COLORS[level],
    }));
  }, [filteredTickets]);

  const recentIssues = useMemo(() => filteredTickets.slice(0, 3), [filteredTickets]);
  const pendingFollowUps = useMemo(
    () => filteredTickets.filter((ticket) => ["open", "in-progress"].includes(ticket.status)).slice(0, 3),
    [filteredTickets]
  );

  const resolvedTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return tickets.filter(
      (ticket) =>
        ["resolved", "closed"].includes(ticket.status) &&
        new Date(ticket.updatedAt || ticket.createdAt).toDateString() === today
    ).length;
  }, [tickets]);

  const avgTicketAge = useMemo(() => {
    if (!tickets.length) return "0 days";
    const avgMs =
      tickets.reduce((sum, ticket) => sum + (Date.now() - new Date(ticket.createdAt).getTime()), 0) /
      tickets.length;
    const avgDays = Math.max(0, Math.round(avgMs / (1000 * 60 * 60 * 24)));
    return `${avgDays} day${avgDays === 1 ? "" : "s"}`;
  }, [tickets]);

  return (
    <div className="nc-page support-page">
      {!preview && (
        <div className="nc-hero">
          <div className="nc-hero-copy">
            <div className="nc-badge">
              <Headset size={14} />
              <span>Netcradus Support Desk</span>
            </div>
            <h1 className="nc-hero-title">
              Welcome, <span className="nc-gradient-text">{userName}</span>
            </h1>
            <p className="nc-role-line">
              Role: <strong>{formatRoleLabel(userRole)}</strong>
            </p>
            <div className="nc-attendance-brief">
              <p className="nc-attendance-kicker">
                <Clock3 size={14} />
                Attendance System
              </p>
              <h2 className="nc-attendance-heading">Attendance system live for your shift</h2>
              <p className="nc-attendance-copy">
                Watch your work timer and manage break time from the live panel placed on the right.
              </p>
            </div>
            <p className="nc-hero-note">
              Triage live tickets, monitor issue flow, and keep follow-ups visible from one support workspace.
            </p>
          </div>

          <div className="nc-hero-actions">
            <AttendanceWidget />
          </div>
        </div>
      )}

      <div className="nc-panel nc-section">
        <div className="nc-controls">
          <div className="nc-controls-left">
            <div className="support-search">
              <Search size={16} />
              <input
                className="nc-input support-search-input"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="nc-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="nc-controls-right">
            <button className="nc-btn nc-btn--primary" onClick={() => navigate("/tickets")}>
              <Plus size={16} />
              Raise Ticket
            </button>
            <button className="nc-btn" onClick={() => navigate("/tickets")}>
              <Download size={16} />
              View All
            </button>
          </div>
        </div>
      </div>

      <div className="support-spacer" />

      <div className="nc-grid support-live-stats">
        <div className="nc-card">
          <div className="support-metric-head">
            <Ticket size={18} />
            <div className="nc-card-title">Visible Tickets</div>
          </div>
          <div className="nc-card-value">{loading ? "--" : filteredTickets.length}</div>
        </div>
        <div className="nc-card">
          <div className="support-metric-head">
            <Headset size={18} />
            <div className="nc-card-title">Open Tickets</div>
          </div>
          <div className="nc-card-value">{loading ? "--" : filteredTickets.filter((ticket) => ticket.status === "open").length}</div>
        </div>
        <div className="nc-card">
          <div className="support-metric-head">
            <CircleAlert size={18} />
            <div className="nc-card-title">Resolved Today</div>
          </div>
          <div className="nc-card-value">{loading ? "--" : resolvedTodayCount}</div>
        </div>
        <div className="nc-card">
          <div className="support-metric-head">
            <TimerReset size={18} />
            <div className="nc-card-title">Avg. Ticket Age</div>
          </div>
          <div className="nc-card-value">{loading ? "--" : avgTicketAge}</div>
        </div>
      </div>

      <div className="support-spacer" />

      <div className="support-graphs">
        <div className="nc-card support-graph-card">
          <div className="support-card-header">
            <h3>Ticket Status Overview</h3>
            <span className="nc-status nc-status--ok">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
              >
                {statusChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="nc-card support-graph-card">
          <div className="support-card-header">
            <h3>Priority Distribution</h3>
            <span className="nc-status nc-status--pending">Filtered</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priorityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {priorityChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="support-spacer" />

      <div className="support-bottom">
        <div className="nc-card">
          <div className="support-card-header">
            <h3>Recent Issues</h3>
            <span className="nc-status nc-status--pending">Hot</span>
          </div>
          <ul className="support-list">
            {recentIssues.length ? (
              recentIssues.map((ticket) => (
                <li key={ticket._id}>
                  {ticket.ticketId} - {ticket.title} ({ticket.priority})
                </li>
              ))
            ) : (
              <li>No recent issues found.</li>
            )}
          </ul>
        </div>

        <div className="nc-card">
          <div className="support-card-header">
            <h3>Pending Follow-ups</h3>
            <span className="nc-status nc-status--ok">Tracked</span>
          </div>
          <ul className="support-list">
            {pendingFollowUps.length ? (
              pendingFollowUps.map((ticket) => (
                <li key={ticket._id}>
                  {ticket.ticketId} - {ticket.title} - {formatDate(ticket.updatedAt || ticket.createdAt)}
                </li>
              ))
            ) : (
              <li>No pending follow-ups right now.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SupportDashboard;
