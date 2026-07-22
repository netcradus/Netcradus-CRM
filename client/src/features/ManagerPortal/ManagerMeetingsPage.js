import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, ChevronRight, Calendar, Video, Phone, Users, MapPin, ExternalLink, RefreshCw, AlertCircle, Eye } from "lucide-react";
import { managerMeetingApi } from "./managerMeetingApi";

const typeLabel = {
  team_meeting: "Team Meeting",
  one_to_one: "One-to-One",
  project_review: "Project Review",
  daily_standup: "Daily Stand-up",
  performance_review: "Performance Review",
  training: "Training",
  internal_discussion: "Internal Discussion"
};

const statusLabel = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled"
};

export default function ManagerMeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    date: "",
    meetingType: "",
    projectId: "",
    status: ""
  });

  const loadMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      const [meetingsRes, projectsRes] = await Promise.all([
        managerMeetingApi.list(),
        managerMeetingApi.projects()
      ]);
      setMeetings(meetingsRes.data?.data || []);
      setProjects(projectsRes.data?.projects || []);
    } catch (err) {
      console.error(err);
      setError("Could not load team meetings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRetry = () => {
    loadMeetings();
  };

  // Compute stats on current meetings list
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    
    // Start and end of this week
    const current = new Date();
    const first = current.getDate() - current.getDay();
    const startOfWeek = new Date(current.setDate(first));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(current.setDate(first + 6));
    endOfWeek.setHours(23, 59, 59, 999);
    
    let upcoming = 0;
    let today = 0;
    let thisWeek = 0;
    let completed = 0;
    let cancelled = 0;
    
    meetings.forEach(m => {
      const mDate = new Date(m.meetingDate);
      const mDateStr = m.meetingDate?.substring(0, 10);
      
      if (m.status === "scheduled" && mDate >= new Date()) upcoming++;
      if (mDateStr === todayStr) today++;
      if (mDate >= startOfWeek && mDate <= endOfWeek) thisWeek++;
      if (m.status === "completed") completed++;
      if (m.status === "cancelled") cancelled++;
    });
    
    return { upcoming, today, thisWeek, completed, cancelled };
  }, [meetings]);

  // Client-side filtering for search & parameters
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      if (filters.meetingType && m.meetingType !== filters.meetingType) return false;
      if (filters.status && m.status !== filters.status) return false;
      if (filters.projectId && m.relatedProject?._id !== filters.projectId) return false;
      if (filters.date && m.meetingDate?.substring(0, 10) !== filters.date) return false;
      
      if (filters.search) {
        const needle = filters.search.toLowerCase();
        const matchesTitle = m.title?.toLowerCase().includes(needle);
        const matchesAgenda = m.agenda?.toLowerCase().includes(needle);
        const matchesNotes = m.notes?.toLowerCase().includes(needle);
        return matchesTitle || matchesAgenda || matchesNotes;
      }
      return true;
    });
  }, [meetings, filters]);

  const formatDateString = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getMeetingIcon = (type) => {
    if (type === "one_to_one") return <Users size={16} style={{ color: "var(--color-primary)" }} />;
    if (type === "project_review") return <Calendar size={16} style={{ color: "var(--color-success)" }} />;
    return <Video size={16} style={{ color: "var(--color-accent)" }} />;
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>ManagerPortal</span><ChevronRight size={10} /><span>Meetings</span>
          </div>
          <h1 className="title">Team Meetings</h1>
          <p className="subtitle">Schedule and coordinate internal discussions, daily stand-ups, and project reviews with your direct reports.</p>
        </div>
        <div className="page-header-right">
          <Link to="/manager/meetings/new" className="btn btn-primary">
            <Plus size={16} /> Schedule Meeting
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div className="nc-stat-card">
          <span className="metric-label">Upcoming</span>
          <span className="metric-value" style={{ color: "var(--color-accent)" }}>{stats.upcoming}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Today</span>
          <span className="metric-value">{stats.today}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">This Week</span>
          <span className="metric-value">{stats.thisWeek}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>{stats.completed}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Cancelled</span>
          <span className="metric-value" style={{ color: "var(--color-text-muted)", opacity: 0.7 }}>{stats.cancelled}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: "36px" }} 
            placeholder="Search meetings title, agenda..." 
            value={filters.search} 
            onChange={e => handleFilterChange("search", e.target.value)} 
          />
        </div>
        <input 
          type="date" 
          className="form-input" 
          style={{ width: "150px", height: "38px" }} 
          value={filters.date} 
          onChange={e => handleFilterChange("date", e.target.value)} 
        />
        <select 
          className="form-select" 
          style={{ width: "160px" }} 
          value={filters.meetingType} 
          onChange={e => handleFilterChange("meetingType", e.target.value)}
        >
          <option value="">All Meeting Types</option>
          {Object.entries(typeLabel).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select 
          className="form-select" 
          style={{ width: "160px" }} 
          value={filters.projectId} 
          onChange={e => handleFilterChange("projectId", e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select 
          className="form-select" 
          style={{ width: "130px" }} 
          value={filters.status} 
          onChange={e => handleFilterChange("status", e.target.value)}
        >
          <option value="">All Status</option>
          {Object.entries(statusLabel).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Error View */}
      {error && (
        <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <AlertCircle size={40} style={{ color: "var(--color-error)", marginBottom: "var(--space-3)", opacity: 0.8 }} />
          <p style={{ color: "var(--color-error)", marginBottom: "var(--space-4)" }}>{error}</p>
          <button className="btn btn-secondary" onClick={handleRetry}><RefreshCw size={14} style={{ marginRight: "6px" }} /> Retry</button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-20)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
          <RefreshCw className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
          <span style={{ color: "var(--color-text-muted)" }}>Loading team meetings...</span>
        </div>
      ) : (
        /* Meetings Table List */
        <div className="nc-card" style={{ overflowX: "auto" }}>
          {filteredMeetings.length === 0 ? (
            <div style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-text-muted)" }}>
              <Calendar size={36} style={{ marginBottom: "var(--space-3)", opacity: 0.3, display: "inline-block" }} />
              <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>No team meetings found.</p>
            </div>
          ) : (
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Meeting Title</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Participants</th>
                  <th>Project</th>
                  <th>Location/Link</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map(m => (
                  <tr key={m._id}>
                    <td style={{ fontWeight: "var(--font-semibold)" }}>{m.title}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                        {getMeetingIcon(m.meetingType)}
                        <span>{typeLabel[m.meetingType] || m.meetingType}</span>
                      </div>
                    </td>
                    <td>{formatDateString(m.meetingDate)}</td>
                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{m.startTime} - {m.endTime}</td>
                    <td style={{ fontSize: "11px", color: "var(--color-text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.participants?.map(p => p.name).join(", ") || "—"}
                    </td>
                    <td>
                      {m.relatedProject ? (
                        <span className="badge badge-neutral" style={{ fontSize: "10px" }}>{m.relatedProject.name}</span>
                      ) : "—"}
                    </td>
                    <td>
                      {m.meetingLink ? (
                        <a href={m.meetingLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-accent)", textDecoration: "none" }}>
                          Join <ExternalLink size={10} />
                        </a>
                      ) : m.location ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                          <MapPin size={10} /> {m.location}
                        </div>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${m.status === 'scheduled' ? 'info' : m.status === 'completed' ? 'success' : 'neutral'}`}>
                        {statusLabel[m.status] || m.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/manager/meetings/${m._id}`} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: "11px" }}>
                        <Eye size={12} style={{ marginRight: "4px" }} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
