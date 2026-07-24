import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import axios from "axios";
import {
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Pencil,
  X,
  Download,
} from "lucide-react";


import { apiUrl } from "../../config/api";

const formatRoleLabel = (role = "") =>
  role === "admin"
    ? "Administrator"
    : String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const maskAccountNumber = (accNum) => {
  if (!accNum) return "Not provided";
  const str = String(accNum);
  if (str.length <= 4) return str;
  return "X".repeat(str.length - 4) + str.slice(-4);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Not provided";
  try {
    return formatInTimeZone(parseISO(dateStr), "Asia/Kolkata", "dd/MM/yyyy");
  } catch (err) {
    try {
      return formatInTimeZone(new Date(dateStr), "Asia/Kolkata", "dd/MM/yyyy");
    } catch (e) {
      return "Not provided";
    }
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState("");

  // Employee Profile Drawer States
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState("Personal");
  const [profileDocs, setProfileDocs] = useState([]);
  const [profileDocsLoading, setProfileDocsLoading] = useState(false);
  const [profileDocsError, setProfileDocsError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // Create User Modal
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
    designation: "",
    skipOnboarding: false,
  });

  // Edit User Modal
  const [editUserId, setEditUserId] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
    designation: "",
    skipOnboarding: false,
  });

  // Password visibility
  const [showCreatePassword, setShowCreatePassword] =
    useState(false);

  const [showEditPassword, setShowEditPassword] =
    useState(false);

  const token = localStorage.getItem("token");

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        apiUrl("/api/auth/users"),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchProfiles = useCallback(async () => {
    try {
      setProfilesLoading(true);
      setProfilesError("");
      const res = await axios.get(apiUrl("/api/contacts/profiles"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setProfilesError("Failed to fetch employee profiles");
    } finally {
      setProfilesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchProfiles();
  }, [fetchUsers, fetchProfiles]);

  // Handle avatar path state
  useEffect(() => {
    if (selectedUserForProfile) {
      const profile = profiles.find(p => {
        const linkedId = typeof p.linkedUser === "object" ? p.linkedUser?._id : p.linkedUser;
        const sourceId = typeof p.sourceUserId === "object" ? p.sourceUserId?._id : p.sourceUserId;
        const targetId = linkedId || sourceId;
        return targetId === selectedUserForProfile._id;
      });
      if (profile?.profilePhoto) {
        setAvatarUrl(apiUrl(profile.profilePhoto));
      } else {
        setAvatarUrl("");
      }
    } else {
      setAvatarUrl("");
    }
  }, [selectedUserForProfile, profiles]);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedUserForProfile(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch docs for selected user
  useEffect(() => {
    if (selectedUserForProfile) {
      const fetchDocs = async () => {
        setProfileDocsLoading(true);
        setProfileDocsError("");
        try {
          const res = await axios.get(
            apiUrl(`/api/documents/files?userId=${selectedUserForProfile._id}&limit=100`),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data?.success) {
            setProfileDocs(res.data.data);
          } else {
            setProfileDocs([]);
          }
        } catch (err) {
          setProfileDocsError("Failed to load documents");
          setProfileDocs([]);
        } finally {
          setProfileDocsLoading(false);
        }
      };
      fetchDocs();
      setActiveProfileTab("Personal");
    } else {
      setProfileDocs([]);
    }
  }, [selectedUserForProfile, token]);

  const handleDownloadDoc = (docId) => {
    window.open(
      apiUrl(`/api/documents/download/${docId}?token=${token || ""}`),
      "_blank"
    );
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("profile-drawer-overlay")) {
      setSelectedUserForProfile(null);
    }
  };

  // Search
  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase();

    return users.filter(
      (u) =>
        (u.name || "")
          .toLowerCase()
          .includes(needle) ||
        (u.email || "")
          .toLowerCase()
          .includes(needle) ||
        (u.role || "")
          .toLowerCase()
          .includes(needle) ||
        (u.designation || "")
          .toLowerCase()
          .includes(needle)
    );
  }, [users, search]);

  // Create User
  const onCreateUser = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        apiUrl("/api/auth/users"),
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("User created successfully");

      setShowModal(false);

      setForm({
        name: "",
        email: "",
        password: "",
        role: "sales",
        designation: "",
        skipOnboarding: false,
      });

      setShowCreatePassword(false);

      fetchUsers();
    } catch (err) {
      setError("Failed to create user");
    }
  };

  // Open Edit Modal
  const onEditUser = (user) => {
    setEditUserId(user._id);

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "sales",
      designation: user.designation || "",
      skipOnboarding: Boolean(user.skipOnboarding),
    });
  };

  // Update User
  const onUpdateUser = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        designation: editForm.designation,
        skipOnboarding: editForm.skipOnboarding,
      };

      // Add password only if entered
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      await axios.patch(
  apiUrl(`/api/auth/users/${editUserId}`),
  payload,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setSuccess("User updated successfully");

      setEditUserId(null);

      setEditForm({
        name: "",
        email: "",
        password: "",
        role: "sales",
        designation: "",
        skipOnboarding: false,
      });

      setShowEditPassword(false);

      fetchUsers();
    } catch (err) {
      setError("Failed to update user");
    }
  };

  // Enable / Disable User
  const onToggleUserAccess = async (user) => {
    try {
      await axios.patch(
        apiUrl(`/api/auth/users/${user._id}/access`),
        {
          isDisabled: !user.isDisabled,
          reason: user.isDisabled
            ? ""
            : "Disabled by Admin",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (err) {
      setError("Access update failed");
    }
  };

  // Delete User
  const onDeleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;

    try {
      await axios.delete(
        apiUrl(`/api/auth/users/${id}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("User deleted successfully");

      fetchUsers();
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  return (
    <div
      className="dashboard-container"
      style={{ padding: "var(--space-6)" }}
    >
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">
            User Management
          </h1>

          <p className="subtitle">
            Manage user accounts, roles and
            access permissions.
          </p>
        </div>

        <div
          className="page-header-right user-management-toolbar"
          style={{
            display: "flex",
            gap: "var(--space-2)",
          }}
        >
          <div
            className="form-field"
            style={{ marginBottom: 0 }}
          >
            <input
              className="form-input"
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{ width: "220px" }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Create User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-6)",
          marginBottom: "var(--space-8)",
        }}
      >
        <div className="nc-stat-card">
          <span className="metric-label">
            Total Users
          </span>

          <span className="metric-value">
            {users.length}
          </span>
        </div>

        <div className="nc-stat-card">
          <span className="metric-label">
            Active Now
          </span>

          <span
            className="metric-value"
            style={{
              color: "var(--color-success)",
            }}
          >
            {
              users.filter(
                (u) => !u.isDisabled
              ).length
            }
          </span>
        </div>

        <div className="nc-stat-card">
          <span className="metric-label">
            Disabled Accounts
          </span>

          <span
            className="metric-value"
            style={{
              color: "var(--color-error)",
            }}
          >
            {
              users.filter(
                (u) => u.isDisabled
              ).length
            }
          </span>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div
          className="badge badge-success"
          style={{
            marginBottom: "var(--space-4)",
            padding:
              "var(--space-2) var(--space-4)",
            width: "100%",
          }}
        >
          {success}
        </div>
      )}

      {/* Table */}
      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id}>
                <td>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      className="clickable-user-name"
                      onClick={() => setSelectedUserForProfile(u)}
                      style={{
                        fontWeight:
                          "var(--font-semibold)",
                      }}
                    >
                      {u.name}
                    </span>

                    <span
                      style={{
                        fontSize: "10px",
                        color:
                          "var(--color-text-muted)",
                      }}
                    >
                      {u.email}
                    </span>
                  </div>
                </td>

                <td>
                  <span className="badge badge-ghost">
                    {formatRoleLabel(u.role)}
                  </span>
                </td>

                <td>
                  {u.designation || "-"}
                </td>

                <td>
                  <span
                    className={`badge badge-${
                      u.isDisabled
                        ? "error"
                        : "success"
                    }`}
                  >
                    {u.isDisabled
                      ? "Disabled"
                      : "Active"}
                  </span>
                </td>

                <td>
                  {u.createdAt
                    ? formatInTimeZone(
                        parseISO(
                          u.createdAt
                        ),
                        "Asia/Kolkata",
                        "dd/MM/yyyy"
                      )
                    : "-"}
                </td>

                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-2)",
                      alignItems: "center",
                    }}
                  >
                    {/* Edit */}
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        onEditUser(u)
                      }
                      title="Edit User"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Enable/Disable */}
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        onToggleUserAccess(
                          u
                        )
                      }
                      title={
                        u.isDisabled
                          ? "Enable"
                          : "Disable"
                      }
                    >
                      {u.isDisabled ? (
                        <ShieldCheck
                          size={16}
                          color="var(--color-success)"
                        />
                      ) : (
                        <ShieldAlert
                          size={16}
                          color="var(--color-warning)"
                        />
                      )}
                    </button>

                    {/* Delete */}
                    {u.role !==
                      "super_user" && (
                      <button
                        className="btn btn-ghost"
                        style={{
                          color:
                            "var(--color-error)",
                        }}
                        onClick={() =>
                          onDeleteUser(
                            u._id
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div
          className="nc-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >
          <div
            className="nc-modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{ width: "400px" }}
          >
            <div className="nc-modal-header">
              <h3>Create New User</h3>
            </div>

            <form
              onSubmit={onCreateUser}
              className="form"
            >
              <div className="form-field">
                <label className="form-label">
                  Full Name
                </label>

                <input
                  className="form-input"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Email Address
                </label>

                <input
                  className="form-input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Password
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <input
                    className="form-input"
                    type={
                      showCreatePassword
                        ? "text"
                        : "password"
                    }
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password:
                          e.target.value,
                      })
                    }
                    style={{
                      paddingRight:
                        "48px",
                    }}
                  />

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setShowCreatePassword(
                        (current) =>
                          !current
                      )
                    }
                    style={{
                      position:
                        "absolute",
                      top: "50%",
                      right: "8px",
                      transform:
                        "translateY(-50%)",
                      minHeight: "36px",
                      minWidth: "36px",
                      padding: 0,
                    }}
                  >
                    {showCreatePassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Role
                </label>

                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="admin">
                    Administrator
                  </option>

                  <option value="management">
                    Management
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                  <option value="sales">
                    Sales
                  </option>

                  <option value="support">
                    Support
                  </option>

                  <option value="hr">
                    HR
                  </option>

                  <option value="it">
                    IT
                  </option>

                  <option value="digital_media">
                    Digital Media
                  </option>

                  {/* Partner is an external role, selectable only from super-user management. */}
                  <option value="partner">
                    Partner
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Designation
                </label>

                <input
                  className="form-input"
                  value={form.designation}
                  placeholder="e.g. Sales Executive"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      designation:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
                <input
                  type="checkbox"
                  id="skipOnboarding"
                  checked={form.skipOnboarding}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      skipOnboarding: e.target.checked,
                    })
                  }
                />
                <label htmlFor="skipOnboarding" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                  Test Account — Skip Onboarding
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  marginTop:
                    "var(--space-6)",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Create User
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUserId && (
        <div
          className="nc-modal-overlay"
          onClick={() =>
            setEditUserId(null)
          }
        >
          <div
            className="nc-modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{ width: "400px" }}
          >
            <div className="nc-modal-header">
              <h3>Edit User</h3>
            </div>

            <form
              onSubmit={onUpdateUser}
              className="form"
            >
              <div className="form-field">
                <label className="form-label">
                  Full Name
                </label>

                <input
                  className="form-input"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Email Address
                </label>

                <input
                  className="form-input"
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      email:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* Password */}
              <div className="form-field">
                <label className="form-label">
                  New Password
                  (Optional)
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <input
                    className="form-input"
                    type={
                      showEditPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Leave blank to keep current password"
                    value={
                      editForm.password
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        password:
                          e.target.value,
                      })
                    }
                    style={{
                      paddingRight:
                        "48px",
                    }}
                  />

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setShowEditPassword(
                        (current) =>
                          !current
                      )
                    }
                    style={{
                      position:
                        "absolute",
                      top: "50%",
                      right: "8px",
                      transform:
                        "translateY(-50%)",
                      minHeight: "36px",
                      minWidth: "36px",
                      padding: 0,
                    }}
                  >
                    {showEditPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Role
                </label>

                <select
                  className="form-select"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="admin">
                    Administrator
                  </option>

                  <option value="management">
                    Management
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                  <option value="sales">
                    Sales
                  </option>

                  <option value="support">
                    Support
                  </option>

                  <option value="hr">
                    HR
                  </option>

                  <option value="it">
                    IT
                  </option>

                  <option value="digital_media">
                    Digital Media
                  </option>

                  {/* Partner is an external role, selectable only from super-user management. */}
                  <option value="partner">
                    Partner
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Designation
                </label>

                <input
                  className="form-input"
                  value={
                    editForm.designation
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      designation:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
                <input
                  type="checkbox"
                  id="editSkipOnboarding"
                  checked={editForm.skipOnboarding}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      skipOnboarding: e.target.checked,
                    })
                  }
                />
                <label htmlFor="editSkipOnboarding" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                  Test Account — Skip Onboarding
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  marginTop:
                    "var(--space-6)",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Update User
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() =>
                    setEditUserId(null)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE PROFILE DETAIL DRAWER */}
      {selectedUserForProfile && (
        <div className="profile-drawer-overlay" onClick={handleOverlayClick}>
          <div
            className="profile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="profile-drawer-header">
              <div className="profile-drawer-header-left">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={selectedUserForProfile.name}
                    className="profile-drawer-avatar"
                    onError={() => setAvatarUrl("")}
                  />
                ) : (
                  <div className="profile-drawer-avatar">
                    {getInitials(selectedUserForProfile.name)}
                  </div>
                )}
                <div className="profile-drawer-title-area">
                  <h3 className="profile-drawer-name">{selectedUserForProfile.name}</h3>
                  <span className="profile-drawer-meta">
                    {(() => {
                      const profile = profiles.find(p => {
                        const linkedId = typeof p.linkedUser === "object" ? p.linkedUser?._id : p.linkedUser;
                        const sourceId = typeof p.sourceUserId === "object" ? p.sourceUserId?._id : p.sourceUserId;
                        const targetId = linkedId || sourceId;
                        return targetId === selectedUserForProfile._id;
                      });
                      const designation = profile?.designation || selectedUserForProfile.designation || "Not provided";
                      const department = profile?.department || selectedUserForProfile.department || "Not provided";
                      const empId = profile?.employeeId ? ` (ID: ${profile.employeeId})` : "";
                      return `${designation} • ${department}${empId}`;
                    })()}
                  </span>
                  <div className="profile-drawer-badge-row">
                    <span className="profile-view-only-badge">View Only</span>
                    <span
                      className={`profile-status-badge badge-${
                        selectedUserForProfile.isDisabled ? "error" : "success"
                      }`}
                    >
                      {selectedUserForProfile.isDisabled ? "Disabled" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="profile-drawer-close-btn"
                onClick={() => setSelectedUserForProfile(null)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="profile-drawer-tabs">
              <button
                type="button"
                className={`profile-drawer-tab ${activeProfileTab === "Personal" ? "active" : ""}`}
                onClick={() => setActiveProfileTab("Personal")}
              >
                Personal
              </button>
              <button
                type="button"
                className={`profile-drawer-tab ${activeProfileTab === "Work" ? "active" : ""}`}
                onClick={() => setActiveProfileTab("Work")}
              >
                Work
              </button>
              <button
                type="button"
                className={`profile-drawer-tab ${activeProfileTab === "Contact" ? "active" : ""}`}
                onClick={() => setActiveProfileTab("Contact")}
              >
                Contact
              </button>
              <button
                type="button"
                className={`profile-drawer-tab ${activeProfileTab === "BankDocs" ? "active" : ""}`}
                onClick={() => setActiveProfileTab("BankDocs")}
              >
                Bank & Docs
              </button>
            </div>

            {/* Body */}
            <div className="profile-drawer-body">
              {/* Info Note at top of body */}
              <div style={{ padding: "10px 14px", backgroundColor: "rgba(232, 66, 10, 0.05)", border: "1px solid rgba(232, 66, 10, 0.15)", borderRadius: "8px", fontSize: "12px", color: "var(--color-accent, #e8420a)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Employee details can be edited from the Employee Profiles section.</span>
              </div>

              {profilesLoading ? (
                <div style={{ padding: "16px" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "16px 0", animation: "pulse 1.5s infinite ease-in-out" }}>
                      <div style={{ width: "30%", height: "12px", backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: "4px" }}></div>
                      <div style={{ width: "70%", height: "16px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "6px" }}></div>
                    </div>
                  ))}
                </div>
              ) : profilesError ? (
                <div style={{ color: "var(--color-error)", textAlign: "center", padding: "20px" }}>
                  {profilesError}
                </div>
              ) : (
                (() => {
                  const profile = profiles.find(p => {
                    const linkedId = typeof p.linkedUser === "object" ? p.linkedUser?._id : p.linkedUser;
                    const sourceId = typeof p.sourceUserId === "object" ? p.sourceUserId?._id : p.sourceUserId;
                    const targetId = linkedId || sourceId;
                    return targetId === selectedUserForProfile._id;
                  }) || null;

                  if (!profile) {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", padding: "24px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(232, 66, 10, 0.05)", color: "var(--color-accent)", marginBottom: "16px" }}>
                          <X size={24} />
                        </div>
                        <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--color-text-primary)" }}>
                          Employee profile has not been completed yet.
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px", maxWidth: "320px", lineHeight: "1.5" }}>
                          This employee's profile can be configured once they complete onboarding, or inside the separate Employee Profiles section.
                        </p>
                      </div>
                    );
                  }

                  const profileData = profile || {};

                  // Look up manager's name if reportsTo is set
                  let managerName = "Not provided";
                  if (profileData.reportsTo) {
                    const manager = profiles.find(p => {
                      const linkedId = typeof p.linkedUser === "object" ? p.linkedUser?._id : p.linkedUser;
                      const sourceId = typeof p.sourceUserId === "object" ? p.sourceUserId?._id : p.sourceUserId;
                      const targetId = linkedId || sourceId;
                      return targetId === profileData.reportsTo;
                    });
                    if (manager) managerName = manager.name;
                  }

                  return (
                    <>
                      {activeProfileTab === "Personal" && (
                        <div className="profile-drawer-section">
                          <div className="profile-drawer-section-title">Personal Information</div>
                          <div className="profile-info-grid">
                            <div className="profile-info-item">
                              <span className="profile-info-label">Full Name</span>
                              <span className="profile-info-value">{profileData.name || selectedUserForProfile.name || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Work Email</span>
                              <span className="profile-info-value">{profileData.email || selectedUserForProfile.email || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Employee ID</span>
                              <span className="profile-info-value">{profileData.employeeId || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Date of Birth</span>
                              <span className="profile-info-value">{formatDate(profileData.dob)}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Gender</span>
                              <span className="profile-info-value">{profileData.gender || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Blood Group</span>
                              <span className="profile-info-value">{profileData.bloodGroup || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Aadhaar Number</span>
                              <span className="profile-info-value">{profileData.aadhaarNumber || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">PAN Number</span>
                              <span className="profile-info-value">{profileData.panNumber || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Joining Date</span>
                              <span className="profile-info-value">{formatDate(profileData.joiningDate)}</span>
                            </div>
                            {profileData.revisedDate && (
                              <div className="profile-info-item">
                                <span className="profile-info-label">Revised Date</span>
                                <span className="profile-info-value">{formatDate(profileData.revisedDate)}</span>
                              </div>
                            )}
                            <div className="profile-info-item" style={{ gridColumn: "span 2" }}>
                              <span className="profile-info-label">Employee Status</span>
                              <span className="profile-info-value">{profileData.employeeStatus || "Not provided"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeProfileTab === "Work" && (
                        <div className="profile-drawer-section">
                          <div className="profile-drawer-section-title">Work Information</div>
                          <div className="profile-info-grid">
                            <div className="profile-info-item">
                              <span className="profile-info-label">Role</span>
                              <span className="profile-info-value">{formatRoleLabel(selectedUserForProfile.role)}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Department</span>
                              <span className="profile-info-value">{profileData.department || selectedUserForProfile.department || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Designation</span>
                              <span className="profile-info-value">{profileData.designation || selectedUserForProfile.designation || "Not provided"}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Reporting Manager</span>
                              <span className="profile-info-value">{managerName}</span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Offered Salary</span>
                              <span className="profile-info-value">
                                {profileData.offeredSalary ? `₹${Number(profileData.offeredSalary).toLocaleString("en-IN")}` : "Not provided"}
                              </span>
                            </div>
                            <div className="profile-info-item">
                              <span className="profile-info-label">Current Salary</span>
                              <span className="profile-info-value">
                                {profileData.salary ? `₹${Number(profileData.salary).toLocaleString("en-IN")}` : "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeProfileTab === "Contact" && (
                        <>
                          <div className="profile-drawer-section">
                            <div className="profile-drawer-section-title">Contact Information</div>
                            <div className="profile-info-grid">
                              <div className="profile-info-item">
                                <span className="profile-info-label">Mobile Number</span>
                                <span className="profile-info-value">{profileData.contactNumber || "Not provided"}</span>
                              </div>
                              <div className="profile-info-item">
                                <span className="profile-info-label">Alternate Mobile Number</span>
                                <span className="profile-info-value">
                                  {profileData.emergencyContact?.alternateContactNumber || "Not provided"}
                                </span>
                              </div>
                              <div className="profile-info-item" style={{ gridColumn: "span 2" }}>
                                <span className="profile-info-label">Address</span>
                                <span className="profile-info-value">{profileData.address || "Not provided"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="profile-drawer-section">
                            <div className="profile-drawer-section-title">Emergency Contact Details</div>
                            <div className="profile-info-grid">
                              <div className="profile-info-item">
                                <span className="profile-info-label">Contact Person Name</span>
                                <span className="profile-info-value">
                                  {profileData.emergencyContact?.name || profileData.emergencyContactName || "Not provided"}
                                </span>
                              </div>
                              <div className="profile-info-item">
                                <span className="profile-info-label">Relationship</span>
                                <span className="profile-info-value">
                                  {profileData.emergencyContact?.relationship || "Not provided"}
                                </span>
                              </div>
                              <div className="profile-info-item">
                                <span className="profile-info-label">Emergency Mobile</span>
                                <span className="profile-info-value">
                                  {profileData.emergencyContact?.contactNumber || profileData.emergencyContactNumber || "Not provided"}
                                </span>
                              </div>
                              <div className="profile-info-item" style={{ gridColumn: "span 2" }}>
                                <span className="profile-info-label">Emergency Address</span>
                                <span className="profile-info-value">{profileData.emergencyContact?.address || "Not provided"}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {activeProfileTab === "BankDocs" && (
                        <>
                          <div className="profile-drawer-section">
                            <div className="profile-drawer-section-title">Bank Information</div>
                            <div className="profile-info-grid">
                              <div className="profile-info-item">
                                <span className="profile-info-label">Bank Name</span>
                                <span className="profile-info-value">{profileData.bankDetails?.bankName || "Not provided"}</span>
                              </div>
                              <div className="profile-info-item">
                                <span className="profile-info-label">Account Holder Name</span>
                                <span className="profile-info-value">{profileData.bankDetails?.accountHolderName || "Not provided"}</span>
                              </div>
                              <div className="profile-info-item">
                                <span className="profile-info-label">Account Number</span>
                                <span className="profile-info-value">{maskAccountNumber(profileData.bankDetails?.accountNumber)}</span>
                              </div>
                              <div className="profile-info-item">
                                <span className="profile-info-label">IFSC Code</span>
                                <span className="profile-info-value">{profileData.bankDetails?.ifscCode || "Not provided"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="profile-drawer-section">
                            <div className="profile-drawer-section-title">Uploaded Documents</div>
                            {profileDocsLoading ? (
                              <div style={{ color: "var(--color-text-muted)", fontSize: "13px", padding: "10px 0" }}>
                                Loading documents...
                              </div>
                            ) : profileDocsError ? (
                              <div style={{ color: "var(--color-error)", fontSize: "13px", padding: "10px 0" }}>
                                {profileDocsError}
                              </div>
                            ) : profileDocs.length === 0 ? (
                              <div style={{ color: "var(--color-text-muted)", fontSize: "13px", padding: "10px 0" }}>
                                No documents uploaded yet.
                              </div>
                            ) : (
                              <div className="profile-doc-list">
                                {profileDocs.map((doc) => (
                                  <div key={doc._id} className="profile-doc-item">
                                    <div>
                                      <div className="profile-doc-name">{doc.documentType || "Other"}</div>
                                      <div className="profile-doc-meta">{doc.originalName}</div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      onClick={() => handleDownloadDoc(doc._id)}
                                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", fontSize: "12px" }}
                                    >
                                      <Download size={12} /> Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
