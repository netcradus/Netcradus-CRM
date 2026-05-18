import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Kanban,
  Plus,
  Columns3,
  FolderKanban,
  ListTodo,
  Activity,
  AlertTriangle,
} from "lucide-react";
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
import { apiUrl } from "../../config/api";

const BASE_PROJECTS = apiUrl("/api/projects");
const BASE_COLUMNS = apiUrl("/api/columns");
const TECH_CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];
const DASHBOARD_REFRESH_MS = 300000;
const DASHBOARD_REQUEST_TIMEOUT_MS = 10000;

const formatRoleLabel = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
});

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.projects)) return payload.projects;
  if (Array.isArray(payload?.columns)) return payload.columns;
  return [];
};

function TechDashboard({ preview = false }) {
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState("");
  const [boardError, setBoardError] = useState("");
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "it";

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const [{ data: cols }, { data: projs }] = await Promise.all([
          axios.get(BASE_COLUMNS, getAuthConfig()),
          axios.get(BASE_PROJECTS, getAuthConfig()),
        ]);
        setColumns(asArray(cols));
        setProjects(asArray(projs));
        setBoardError("");
      } catch (error) {
        setColumns([]);
        setProjects([]);
        setBoardError("Project board data is not available right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
    const interval = setInterval(fetchBoardData, DASHBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const getColumnProjects = (columnId) =>
    projects.filter((project) => String(project.columnId?._id ?? project.columnId) === String(columnId));

  const avgProgressValue = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + (Number(project.progress) || 0), 0) / projects.length)
    : 0;

  const columnLoadData = useMemo(() => columns.map(column => ({
    name: column.name,
    cards: projects.filter(p => String(p.columnId?._id ?? p.columnId) === String(column._id)).length,
  })), [columns, projects]);

  const deliveryStateData = useMemo(() => {
    const grouped = { Backlog: 0, Building: 0, Healthy: 0, Complete: 0 };
    projects.forEach(p => {
      const prog = Number(p.progress) || 0;
      if (prog >= 100) grouped.Complete++;
      else if (prog >= 60) grouped.Healthy++;
      else if (prog > 0) grouped.Building++;
      else grouped.Backlog++;
    });
    return Object.entries(grouped).map(([name, value], idx) => ({ name, value, color: TECH_CHART_COLORS[idx % TECH_CHART_COLORS.length] }));
  }, [projects]);

  const handleAddColumn = async () => {
    const name = newProject.trim();
    if (!name) return;
    try {
      const { data } = await axios.post(BASE_COLUMNS, { name, color: "var(--color-accent)" }, getAuthConfig());
      setColumns(curr => [...curr, data]);
      setNewProject("");
    } catch (error) {
      setBoardError("Unable to create column.");
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">IT / Engineering Dashboard</h1>
          <p className="subtitle">Project board overview and delivery tracking.</p>
        </div>
        {!preview && (
          <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <input 
                className="form-input" 
                placeholder="New column name..." 
                value={newProject} 
                onChange={e => setNewProject(e.target.value)} 
                style={{ height: '36px', width: '200px' }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAddColumn}>
              <Plus size={16} /> Add Column
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Live Projects</span>
          <span className="metric-value">{projects.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Workflow Columns</span>
          <span className="metric-value">{columns.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Avg. Progress</span>
          <span className="metric-value">{avgProgressValue}%</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Overdue Cards</span>
          <span className="metric-value" style={{ color: 'var(--color-error)' }}>
            {projects.filter(p => p.deadline && new Date(p.deadline) < new Date() && (Number(p.progress)||0) < 100).length}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Board Load by Column</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={columnLoadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
              <Bar dataKey="cards" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Delivery Stages</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={deliveryStateData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {deliveryStateData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {deliveryStateData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {columns.map(column => {
          const cards = getColumnProjects(column._id);
          return (
            <div key={column._id} className="nc-card" style={{ background: 'var(--color-bg-surface)', borderTop: '2px solid var(--color-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>{column.name}</h3>
                <span className="badge badge-ghost">{cards.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {cards.map(card => (
                  <div key={card._id} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>{card.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{Number(card.progress) || 0}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
                      <div style={{ width: `${card.progress}%`, height: '100%', background: 'var(--color-accent)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{card.client || 'Internal'}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{formatDate(card.deadline)}</span>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="nc-card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Shift Attendance</h3>
        <AttendanceWidget />
      </div>
    </div>
  );
}

export default TechDashboard;
