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
} from "lucide-react";


import { apiUrl } from "../../config/api";

const formatRoleLabel = (role = "") =>
  role === "admin"
    ? "Administrator"
    : String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState("");

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
  });

  // Edit User Modal
  const [editUserId, setEditUserId] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
    designation: "",
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    </div>
  );
};

export default UserManagement;