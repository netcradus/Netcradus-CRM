import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { broadcastApi } from "./broadcastApi";

const DEPARTMENTS = [
  { value: "admin", label: "Admin" },
  { value: "management", label: "Management" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "hr", label: "HR" },
  { value: "it", label: "IT" },
  { value: "digitalmedia", label: "Digital Media" },
  { value: "partner", label: "Partner" }
];

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "management", label: "Management" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "hr", label: "HR" },
  { value: "it", label: "IT" },
  { value: "digital_media", label: "Digital Media" },
  { value: "partner", label: "Partner" }
];

export default function CreateBroadcastModal({ isOpen, onClose, onPublishSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetType, setTargetType] = useState("all");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && targetType === "selected_users" && usersList.length === 0) {
      setLoadingUsers(true);
      broadcastApi.getUsers()
        .then(res => {
          setUsersList(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => {
          setError("Failed to load user directory.");
        })
        .finally(() => {
          setLoadingUsers(false);
        });
    }
  }, [isOpen, targetType, usersList.length]);

  if (!isOpen) return null;

  const handleToggleDepartment = (value) => {
    setSelectedDepartments(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleToggleRole = (value) => {
    setSelectedRoles(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

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

    if (targetType === "department" && selectedDepartments.length === 0) {
      setError("Please select at least one target department.");
      return;
    }

    if (targetType === "role" && selectedRoles.length === 0) {
      setError("Please select at least one target role.");
      return;
    }

    if (targetType === "selected_users" && selectedUsers.length === 0) {
      setError("Please select at least one targeted user.");
      return;
    }

    try {
      setPublishing(true);
      await broadcastApi.create({
        title: trimmedTitle,
        content: trimmedContent,
        priority,
        targetType,
        targetDepartments: targetType === "department" ? selectedDepartments : [],
        targetRoles: targetType === "role" ? selectedRoles : [],
        targetUserIds: targetType === "selected_users" ? selectedUsers : []
      });

      // Clear state and close
      setTitle("");
      setContent("");
      setPriority("normal");
      setTargetType("all");
      setSelectedDepartments([]);
      setSelectedRoles([]);
      setSelectedUsers([]);
      
      onPublishSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish announcement. Please ensure active recipients exist.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: "500px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="nc-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h3 style={{ margin: 0 }}>Create Announcement</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ minWidth: "32px", minHeight: "32px", padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-3)", borderRadius: "var(--border-radius-md)", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", marginBottom: "var(--space-4)", fontSize: "var(--font-size-sm)" }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              required
              value={title}
              maxLength={150}
              placeholder="Notice title..."
              onChange={e => setTitle(e.target.value)}
              disabled={publishing}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Message</label>
            <textarea
              className="form-input"
              required
              rows={5}
              value={content}
              maxLength={5000}
              placeholder="Announcement description..."
              style={{ resize: "vertical", fontFamily: "inherit" }}
              onChange={e => setContent(e.target.value)}
              disabled={publishing}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              disabled={publishing}
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Target Group</label>
            <select
              className="form-select"
              value={targetType}
              onChange={e => setTargetType(e.target.value)}
              disabled={publishing}
            >
              <option value="all">All Employees</option>
              <option value="department">By Department</option>
              <option value="role">By Role</option>
              <option value="selected_users">Selected Staff Members</option>
            </select>
          </div>

          {targetType === "department" && (
            <div className="form-field">
              <label className="form-label">Select Target Departments</label>
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", padding: "var(--space-3)", maxHeight: "150px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                {DEPARTMENTS.map(dept => (
                  <label key={dept.value} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--font-size-sm)", cursor: "pointer", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(dept.value)}
                      onChange={() => handleToggleDepartment(dept.value)}
                      disabled={publishing}
                    />
                    {dept.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {targetType === "role" && (
            <div className="form-field">
              <label className="form-label">Select Target Roles</label>
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", padding: "var(--space-3)", maxHeight: "150px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                {ROLES.map(role => (
                  <label key={role.value} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--font-size-sm)", cursor: "pointer", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => handleToggleRole(role.value)}
                      disabled={publishing}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {targetType === "selected_users" && (
            <div className="form-field">
              <label className="form-label">Select Recipients</label>
              {loadingUsers ? (
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Loading employee directory...</div>
              ) : (
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", padding: "var(--space-3)", maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {usersList.map(user => (
                    <label key={user._id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--font-size-sm)", cursor: "pointer", margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleToggleUser(user._id)}
                        disabled={publishing}
                      />
                      <span>{user.name} <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>({user.email} - {user.role})</span></span>
                    </label>
                  ))}
                  {usersList.length === 0 && (
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>No assignable users found.</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ flex: 1 }}
              disabled={publishing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={publishing}
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
