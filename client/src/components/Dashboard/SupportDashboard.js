import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Download, Ticket, TimerReset, CircleAlert } from "lucide-react";
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
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { apiUrl } from "../../config/api";

const STATUS_COLORS = {
  open: "var(--color-warning)",
  "in-progress": "var(--color-accent)",
  resolved: "var(--color-success)",
  closed: "var(--color-text-muted)",
};

const PRIORITY_COLORS = {
  low: "var(--color-info)",
  medium: "var(--color-warning)",
  high: "var(--color-accent)",
  urgent: "var(--color-error)",
};

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
      const matchesSearch = !searchValue || [ticket.ticketId, ticket.title, ticket.category, ticket.priority, ticket.raisedBy?.name].some(v => String(v||"").toLowerCase().includes(searchValue));
      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, statusFilter, tickets]);

  const statusChartData = useMemo(() => {
    const counts = filteredTickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || "var(--color-bg-elevated)" }));
  }, [filteredTickets]);

  const priorityChartData = useMemo(() => {
    const counts = filteredTickets.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {});
    return ["low", "medium", "high", "urgent"].map(level => ({ name: level, value: counts[level] || 0, color: PRIORITY_COLORS[level] }));
  }, [filteredTickets]);

  const resolvedTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return tickets.filter(t => ["resolved", "closed"].includes(t.status) && new Date(t.updatedAt || t.createdAt).toDateString() === today).length;
  }, [tickets]);

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Support Dashboard</h1>
          <p className="subtitle">Ticketing overview and customer support activity.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-outline" onClick={() => navigate("/tickets")}>
            <Download size={16} /> Reports
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/tickets")}>
            <Plus size={16} /> New Ticket
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Total Tickets</span>
          <span className="metric-value">{loading ? "--" : tickets.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Open Tickets</span>
          <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{loading ? "--" : tickets.filter(t => t.status === 'open').length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Resolved Today</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{loading ? "--" : resolvedTodayCount}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">In Progress</span>
          <span className="metric-value" style={{ color: 'var(--color-accent)' }}>{loading ? "--" : tickets.filter(t => t.status === 'in-progress').length}</span>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div className="form-field" style={{ marginBottom: 0, flex: 1 }}>
            <input className="form-input" placeholder="Search ticket ID, title or user..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
            <option value="All">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Status Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'center' }}>
            {statusChartData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Priority Load</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Ticket List</h3>
          <table className="nc-table">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Priority</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filteredTickets.slice(0, 5).map(t => (
                <tr key={t._id}>
                  <td>{t.ticketId}</td>
                  <td>{t.title}</td>
                  <td>
                    <span className={`badge badge-${t.priority === 'urgent' || t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'info'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${t.status === 'resolved' ? 'success' : 'warning'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>No tickets found</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Desk Attendance</h3>
          <AttendanceWidget />
        </div>
      </div>
    </div>
  );
}

export default SupportDashboard;
