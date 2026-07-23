import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { managerBroadcastApi } from "./broadcastApi";

export default function CreateManagerBroadcastModal({ isOpen, onClose, onPublishSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetType, setTargetType] = useState("all_team");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [teamList, setTeamList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // Load manager's team list for Selected Team Members option
  useEffect(() => {
    if (isOpen && targetType === "selected_users" && teamList.length === 0) {
      setLoadingTeam(true);
      managerBroadcastApi.getManagerTeam()
        .then(res => {
          // Response can be plain list, or structured. Let's make it robust.
          const data = res.data;
          setTeamList(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
        })
        .catch(() => {
          setError("Failed to load team directory.");
        })
        .finally(() => {
          setLoadingTeam(false);
        });
    }
  }, [isOpen, targetType, teamList.length]);

  // Load manager's projects list for Project Team option
  useEffect(() => {
    if (isOpen && targetType === "project_team" && projectsList.length === 0) {
      setLoadingProjects(true);
      managerBroadcastApi.getManagerProjects()
        .then(res => {
          const data = res.data;
          const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setProjectsList(list.filter(p => !p.isDeleted));
        })
        .catch(() => {
          setError("Failed to load projects.");
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
  }, [isOpen, targetType, projectsList.length]);

  if (!isOpen) return null;

  const handleToggleUser = (value) => {
    setSelectedUsers(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || trimmedTitle.length > 150) {
      setError("Title is required and must be under 150 characters.");
      return;
    }

    if (!trimmedContent || trimmedContent.length > 5000) {
      setError("Message content is required and must be under 5000 characters.");
      return;
    }

    if (targetType === "selected_users" && selectedUsers.length === 0) {
      setError("Please select at least one team member.");
      return;
    }

    if (targetType === "project_team" && !selectedProjectId) {
      setError("Please select a target project team.");
      return;
    }

    try {
      setPublishing(true);
      const payload = {
        title: trimmedTitle,
        content: trimmedContent,
        priority,
        targetType,
        targetUserIds: targetType === "selected_users" ? selectedUsers : [],
        targetProjectId: targetType === "project_team" ? selectedProjectId : undefined
      };

      const res = await managerBroadcastApi.create(payload);
      if (res.data?.success) {
        // Reset form states
        setTitle("");
        setContent("");
        setPriority("normal");
        setTargetType("all_team");
        setSelectedUsers([]);
        setSelectedProjectId("");
        onPublishSuccess();
        onClose();
      } else {
        setError(res.data?.message || "Failed to publish announcement.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: "600px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="nc-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h3 style={{ margin: 0, fontSize: "var(--font-size-lg)", fontWeight: "var(--font-bold)" }}>Publish Team Announcement</h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3)", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--border-radius-md)", color: "var(--danger)", fontSize: "var(--font-size-sm)" }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Announcement Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning Session rescheduled"
              maxLength={150}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Announcement Content</label>
            <textarea
              className="form-input"
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your announcement details here..."
              maxLength={5000}
              required
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div className="form-field">
              <label className="form-label">Priority Level</label>
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Target Audience</label>
              <select className="form-select" value={targetType} onChange={e => setTargetType(e.target.value)}>
                <option value="all_team">My Entire Team</option>
                <option value="selected_users">Selected Team Members</option>
                <option value="project_team">My Project Team</option>
              </select>
            </div>
          </div>

          {/* Conditional Target UI: Selected Team Members */}
          {targetType === "selected_users" && (
            <div className="form-field">
              <label className="form-label" style={{ marginBottom: "var(--space-2)" }}>Select Recipients</label>
              {loadingTeam ? (
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Loading team directory...</div>
              ) : teamList.length === 0 ? (
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--warning)" }}>No team members found in your reporting line.</div>
              ) : (
                <div style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-md)",
                  padding: "var(--space-2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  {teamList.map((user) => (
                    <label key={user._id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--font-size-sm)", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }} className="hover-bg">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleToggleUser(user._id)}
                        style={{ cursor: "pointer" }}
                      />
                      <span>{user.name} <span style={{ opacity: 0.6, fontSize: "11px" }}>({user.role} | {user.department})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conditional Target UI: My Project Team */}
          {targetType === "project_team" && (
            <div className="form-field">
              <label className="form-label">Select Project</label>
              {loadingProjects ? (
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Loading projects...</div>
              ) : projectsList.length === 0 ? (
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--warning)" }}>No active projects found.</div>
              ) : (
                <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} required>
                  <option value="">-- Choose Project --</option>
                  {projectsList.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={publishing}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={publishing}>
              {publishing ? "Publishing..." : "Publish Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
