import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users2, ArrowLeft, Eye } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../../config/api";

const ManagerTeamPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Users2 size={28} style={{ color: "var(--color-primary)" }} />
            <div>
              <h1 className="title" style={{ margin: 0 }}>My Team</h1>
              <p className="subtitle" style={{ margin: 0 }}>Direct and indirect reportees on your team.</p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/manager/dashboard")}>
            <ArrowLeft size={16} style={{ marginRight: "var(--space-2)" }} />
            Back to Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="badge badge-error" style={{ padding: "var(--space-2) var(--space-4)", marginBottom: "var(--space-4)", width: "100%" }}>
          {error}
        </div>
      )}

      <div className="nc-card">
        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
            Loading team data...
          </div>
        ) : team.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>
            <Users2 size={48} style={{ marginBottom: "var(--space-4)", opacity: 0.3 }} />
            <h3>No Team Members</h3>
            <p style={{ fontSize: "var(--text-sm)" }}>No subordinate employees are currently assigned to report to you.</p>
          </div>
        ) : (
          <div className="nc-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="nc-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <div style={{ fontWeight: "var(--font-medium)" }}>{member.name}</div>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.department || "General"}</td>
                    <td>{member.designation || "-"}</td>
                    <td>
                      <span className="badge badge-ghost">
                        {roleLabel(member.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${member.isDisabled ? "error" : "success"}`}>
                        {member.isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/manager/team/${member._id}`)}
                        title="View Profile"
                      >
                        <Eye size={16} style={{ marginRight: "var(--space-1)" }} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerTeamPage;
