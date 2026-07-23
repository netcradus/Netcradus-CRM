import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Mail, Briefcase, Calendar, Shield, UserCheck } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../../config/api";

const ManagerTeamMemberPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchMember = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(apiUrl(`/api/manager/team/${userId}`), { headers });
      setMember(data.member || null);
    } catch (err) {
      setError("Unable to load team member profile.");
    } finally {
      setLoading(false);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const roleLabel = (role = "") =>
    role === "admin" ? "Administrator" : String(role).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "-";
    }
  };

  return (
    <div className="nc-page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <User size={28} style={{ color: "var(--color-primary)" }} />
            <div>
              <h1 className="title" style={{ margin: 0 }}>Team Member Profile</h1>
              <p className="subtitle" style={{ margin: 0 }}>Read-only profile details of your reportee.</p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/manager/team")}>
            <ArrowLeft size={16} style={{ marginRight: "var(--space-2)" }} />
            Back to Team
          </button>
        </div>
      </div>

      {error && (
        <div className="badge badge-error" style={{ padding: "var(--space-2) var(--space-4)", marginBottom: "var(--space-4)", width: "100%" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="nc-card" style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
          Loading profile details...
        </div>
      ) : !member ? (
        <div className="nc-card" style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>
          <User size={48} style={{ marginBottom: "var(--space-4)", opacity: 0.3 }} />
          <h3>Member Not Found</h3>
          <p style={{ fontSize: "var(--text-sm)" }}>The requested employee could not be found or is not in your subordinate hierarchy.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)" }}>
          {/* Main profile card */}
          <div className="nc-card nc-section" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-4)" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "var(--color-primary-light, #e0f2fe)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--font-bold)",
                }}
              >
                {member.name ? member.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>{member.name}</h2>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                  {member.designation || "Employee"} · {member.department || "General"}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)" }}>
              {/* General Details */}
              <div>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-3)" }}>
                  General Information
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                    <Mail size={16} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Email Address</div>
                      <div>{member.email}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                    <Briefcase size={16} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Department / Designation</div>
                      <div>{member.department || "General"} - {member.designation || "N/A"}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                    <Shield size={16} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>System Role</div>
                      <div>{roleLabel(member.role)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Hierarchy */}
              <div>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-3)" }}>
                  Status & Hierarchy
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                    <UserCheck size={16} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Employment Status</div>
                      <div>
                        <span className={`badge badge-${member.isDisabled ? "error" : "success"}`}>
                          {member.isDisabled ? "Disabled" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                    <Calendar size={16} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Joined Date</div>
                      <div>{formatDate(member.createdAt)}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                    <User size={16} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Reporting Manager</div>
                      <div>
                        {member.reportsTo ? (
                          <span>{member.reportsTo.name} ({roleLabel(member.reportsTo.role)})</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>None (Direct)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTeamMemberPage;
