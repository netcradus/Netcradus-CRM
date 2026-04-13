import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Kanban,
  Plus,
  Columns3,
  Clock3,
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
import "./TechDashboard.css";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { apiUrl } from "../../config/api";

const BASE_PROJECTS = apiUrl("/api/projects");
const BASE_COLUMNS = apiUrl("/api/columns");
const TECH_CHART_COLORS = ["#ff8a00", "#ff5f3d", "#ff4f9a", "#38bdf8"];

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
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
          axios.get(BASE_COLUMNS),
          axios.get(BASE_PROJECTS),
        ]);
        setColumns(cols || []);
        setProjects(projs || []);
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
    const interval = setInterval(fetchBoardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getColumnProjects = (columnId) =>
    projects.filter((project) => String(project.columnId?._id ?? project.columnId) === String(columnId));

  const summaryCards = useMemo(() => {
    const progressValues = projects.map((project) => Number(project.progress) || 0);
    const avgProgress = progressValues.length
      ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
      : 0;
    const overdueProjects = projects.filter((project) => {
      if (!project.deadline) return false;
      const deadline = new Date(project.deadline);
      return !Number.isNaN(deadline.getTime()) && deadline < new Date() && (Number(project.progress) || 0) < 100;
    }).length;

    return [
      {
        key: "live-projects",
        icon: <FolderKanban size={18} />,
        label: "Live Projects",
        value: projects.length,
        meta: `${columns.length} active columns`,
      },
      {
        key: "total-columns",
        icon: <Columns3 size={18} />,
        label: "Workflow Columns",
        value: columns.length,
        meta: "Synced from project board",
      },
      {
        key: "avg-progress",
        icon: <Activity size={18} />,
        label: "Average Progress",
        value: `${avgProgress}%`,
        meta: "Across all live project cards",
      },
      {
        key: "overdue-projects",
        icon: <AlertTriangle size={18} />,
        label: "Overdue Cards",
        value: overdueProjects,
        meta: "Past deadline and not complete",
      },
    ];
  }, [columns.length, projects]);

  const columnLoadData = useMemo(
    () =>
      columns.map((column) => ({
        name: column.name,
        cards: projects.filter(
          (project) => String(project.columnId?._id ?? project.columnId) === String(column._id)
        ).length,
      })),
    [columns, projects]
  );

  const deliveryStateData = useMemo(() => {
    const grouped = {
      Backlog: 0,
      Building: 0,
      Healthy: 0,
      Complete: 0,
    };

    projects.forEach((project) => {
      const progress = Number(project.progress) || 0;
      if (progress >= 100) {
        grouped.Complete += 1;
      } else if (progress >= 60) {
        grouped.Healthy += 1;
      } else if (progress > 0) {
        grouped.Building += 1;
      } else {
        grouped.Backlog += 1;
      }
    });

    return Object.entries(grouped).map(([name, value], index) => ({
      name,
      value,
      color: TECH_CHART_COLORS[index % TECH_CHART_COLORS.length],
    }));
  }, [projects]);

  const deadlineTrendData = useMemo(() => {
    const grouped = projects.reduce((acc, project) => {
      if (!project.deadline) return acc;
      const date = new Date(project.deadline);
      if (Number.isNaN(date.getTime())) return acc;
      const key = date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);
  }, [projects]);

  const avgProgressValue = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + (Number(project.progress) || 0), 0) / projects.length)
    : 0;

  const handleAddColumn = async () => {
    const name = newProject.trim();
    if (!name) return;

    try {
      const { data } = await axios.post(BASE_COLUMNS, { name, color: "#ff8a00" });
      setColumns((current) => [...current, data]);
      setNewProject("");
      setBoardError("");
    } catch (error) {
      setBoardError("Unable to create a project column right now.");
    }
  };

  return (
    <div className={`nc-page tech-page ${preview ? "preview-mode" : ""}`}>
      {!preview && (
        <div className="nc-hero">
          <div className="nc-hero-copy">
            <div className="nc-badge">
              <Kanban size={14} />
              <span>Netcradus IT Workspace</span>
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
                The panel on the right keeps your work timer and break controls visible while you manage tasks.
              </p>
            </div>
            <p className="nc-hero-note">
              Monitor your real project board, track delivery progress, and keep engineering work visible in real time.
            </p>
          </div>

          <div className="nc-hero-actions">
            <AttendanceWidget />
          </div>
        </div>
      )}

      {!preview && (
        <>
          <div className="tech-live-grid">
            {summaryCards.map((card) => (
              <div key={card.key} className="tech-live-card">
                <div className="tech-live-icon">{card.icon}</div>
                <div>
                  <p className="tech-live-label">{card.label}</p>
                  <h3 className="tech-live-value">{loading ? "--" : card.value}</h3>
                  <span className="tech-live-meta">{card.meta}</span>
                </div>
              </div>
            ))}
          </div>

         

          <div className="tech-analytics-grid">
            <div className="tech-analytics-card tech-health-card">
              <div className="tech-chart-head">
                <div>
                  <p className="tech-kicker">Delivery Health</p>
                  <h3>Average Completion Pulse</h3>
                </div>
                <span className="nc-status nc-status--ok">Live</span>
              </div>
              <div className="tech-health-ring" style={{ "--tech-fill": `${avgProgressValue}%` }}>
                <div className="tech-health-center">
                  <strong>{avgProgressValue}%</strong>
                  <span>Avg progress</span>
                </div>
              </div>
              <div className="tech-health-meta">
                <span>{projects.length} live cards tracked</span>
                <span>{summaryCards[3].value} overdue</span>
              </div>
            </div>

            <div className="tech-analytics-card">
              <div className="tech-chart-head">
                <div>
                  <p className="tech-kicker">Board Flow</p>
                  <h3>Cards by Column</h3>
                </div>
                <span className="nc-status nc-status--pending">Board sync</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={columnLoadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="cards" fill="#ff8a00" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="tech-analytics-card">
              <div className="tech-chart-head">
                <div>
                  <p className="tech-kicker">Progress Mix</p>
                  <h3>Delivery Stage Split</h3>
                </div>
                <span className="nc-status">Realtime</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={deliveryStateData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={94}
                    paddingAngle={4}
                  >
                    {deliveryStateData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="tech-analytics-card">
              <div className="tech-chart-head">
                <div>
                  <p className="tech-kicker">Deadline Trend</p>
                  <h3>Upcoming Due Load</h3>
                </div>
                <span className="nc-status">6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={deadlineTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ff4f9a"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#ff8a00" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

           <div className="nc-panel nc-section">
            <div className="nc-controls">
              <div className="nc-controls-left">
                <div className="tech-add-project">
                  <Columns3 size={16} />
                  <input
                    className="nc-input tech-project-input"
                    type="text"
                    placeholder="New project column"
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                  />
                </div>
              </div>

              <div className="nc-controls-right">
                <button className="nc-btn nc-btn--primary" onClick={handleAddColumn}>
                  <Plus size={16} />
                  Add Column
                </button>
              </div>
            </div>
            {boardError && <div className="tech-board-error">{boardError}</div>}
          </div>
        </>
      )}

      <div className="board-container">
        {columns.map((column) => {
          const cards = getColumnProjects(column._id);

          return (
            <div key={column._id} className="board-column">
              <div className="board-column-header">
                <h2>{column.name}</h2>
                <span className="board-count">{cards.length}</span>
              </div>

              <div className="cards">
                {loading ? (
                  <div className="card tech-empty-card">Loading project cards...</div>
                ) : cards.length ? (
                  cards.map((card) => (
                    <div key={card._id} className="card">
                      <div className="tech-card-title-row">
                        <strong>{card.name}</strong>
                        <span className="tech-card-progress">{Number(card.progress) || 0}%</span>
                      </div>
                      {card.description && <p className="tech-card-desc">{card.description}</p>}
                      <div className="tech-card-meta">
                        <span>
                          <ListTodo size={12} />
                          {card.client || "Internal"}
                        </span>
                        <span>{formatDate(card.deadline) || "No deadline"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card tech-empty-card">No project cards in this column</div>
                )}
              </div>
            </div>
          );
        })}

        {!loading && !columns.length && (
          <div className="board-column">
            <div className="board-column-header">
              <h2>Project Board</h2>
              <span className="board-count">0</span>
            </div>
            <div className="cards">
              <div className="card tech-empty-card">No live columns found. Create one above to begin.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TechDashboard;
