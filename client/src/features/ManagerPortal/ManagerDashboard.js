import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users2, LayoutGrid, TrendingUp, Clock, ChevronRight, UserCog } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../../config/api";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Manager";

  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(apiUrl("/api/manager/team"), { headers });
      setTeam(data.team || []);
    } catch (err) {
      setError("Unable to load team data.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const roleLabel = (role = "") =>
    role === "admin" ? "Administrator" : String(role).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="nc-page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <UserCog size={28} style={{ color: "var(--color-primary)" }} />
          <div>
            <h1 className="title" style={{ margin: 0 }}>Manager Dashboard</h1>
            <p className="subtitle" style={{ margin: 0 }}>Welcome back, {userName}.</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/manager/team")}>
          <span className="metric-label">Team Members</span>
          <span className="metric-value">{loading ? "—" : team.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Members</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>
            {loading ? "—" : team.filter((m) => !m.isDisabled).length}
          </span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Departments</span>
          <span className="metric-value">
            {loading ? "—" : new Set(team.map((m) => m.department).filter(Boolean)).size}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="nc-panel nc-section" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
          Quick Actions
        </h2>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => navigate("/manager/team")}>
            <Users2 size={16} style={{ marginRight: "var(--space-2)" }} />
            View My Team
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/tasks")}>
            <LayoutGrid size={16} style={{ marginRight: "var(--space-2)" }} />
            Task Board
          </button>
        </div>
      </div>

      {/* Team Preview */}
      <div className="nc-panel nc-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", margin: 0 }}>
            My Team
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/manager/team")}>
            View All <ChevronRight size={14} />
          </button>
        </div>

        {error && (
          <div className="badge badge-error" style={{ padding: "var(--space-2) var(--space-4)", marginBottom: "var(--space-4)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Loading team...</p>
        ) : team.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
            <Users2 size={32} style={{ marginBottom: "var(--space-3)", opacity: 0.4 }} />
            <p>No team members found. Contact HR to set up your reporting hierarchy.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {team.slice(0, 5).map((member) => (
              <div
                key={member._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-alt)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onClick={() => navigate(`/manager/team/${member._id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-surface-alt)")}
              >
                <div>
                  <div style={{ fontWeight: "var(--font-medium)", fontSize: "var(--text-sm)" }}>{member.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {member.designation || roleLabel(member.role)} · {member.department || "General"}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </div>
            ))}
            {team.length > 5 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "var(--space-2)", alignSelf: "flex-start" }}
                onClick={() => navigate("/manager/team")}
              >
                +{team.length - 5} more members
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
