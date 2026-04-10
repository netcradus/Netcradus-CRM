import React, { useCallback, useEffect, useState } from "react";
import { FaUsersCog } from "react-icons/fa";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./UserManagement.css";

const formatRoleLabel = (role = "") =>
  role === "admin"
    ? "Administrator"
    : String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
  });

  const [pwdUserId, setPwdUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [accessReason, setAccessReason] = useState("");

  const token = localStorage.getItem("token");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl("/api/auth/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const onCreateUser = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(apiUrl("/api/auth/users"), form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(res.data?.message || "User created successfully");
      setForm({
        name: "",
        email: "",
        password: "",
        role: "sales",
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const onDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(apiUrl(`/api/auth/users/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("User deleted successfully");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const onUpdateUser = async (user, field, value) => {
    try {
      await axios.patch(
        apiUrl(`/api/auth/users/${user._id}`),
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`${field} updated for ${user.name}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  const onChangePassword = async (id) => {
    if (!newPassword) {
      setError("New password required");
      return;
    }

    try {
      await axios.put(
        apiUrl(`/api/auth/users/${id}/password`),
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Password updated successfully");
      setPwdUserId(null);
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  const onToggleUserAccess = async (user) => {
    const nextDisabledState = !user.isDisabled;
    const reason = nextDisabledState
      ? (accessReason || window.prompt(`Reason for disabling ${user.name}?`, "Temporarily disabled by Super Admin") || "")
      : "";

    try {
      const res = await axios.patch(
        apiUrl(`/api/auth/users/${user._id}/access`),
        { isDisabled: nextDisabledState, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data?.message || "User access updated successfully");
      setAccessReason("");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update access");
    }
  };

  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title">
        <FaUsersCog /> Administrator User Management
      </h2>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-grid">
        <section className="admin-card">
          <h3>Create New User</h3>
          <p className="admin-warning-note">
            <strong>Note:</strong> For security, only one primary Administrator account is permitted.
          </p>

          <form onSubmit={onCreateUser} className="admin-form">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Full Name"
              required
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="User Email"
              required
            />

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Password"
              required
            />

            <select name="role" value={form.role} onChange={onChange}>
              <option value="admin">Administrator</option>
              <option value="management">Management</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="digital_media">Digital Media</option>
            </select>

            <button type="submit">Create User</button>
          </form>
        </section>

        <section className="admin-card">
          <h3>All Users</h3>

          {loading ? (
            <p className="admin-muted">Loading users...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Access</th>
                    <th>Full Name</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td data-label="User ID">{user.userId || "-"}</td>
                        <td data-label="Email">{user.email}</td>
                        <td data-label="Role">
                          <span className={`role-badge role-${user.role}`}>
                            {formatRoleLabel(user.role)}
                          </span>
                        </td>
                        <td data-label="Access">
                          <span className={`role-badge ${user.isDisabled ? "role-management" : "role-sales"}`}>
                            {user.isDisabled ? "Disabled" : "Active"}
                          </span>
                        </td>
                        <td data-label="Full Name">
                          <input
                            className="inline-edit-input"
                            defaultValue={user.name}
                            onBlur={(e) => {
                              if (e.target.value !== user.name) {
                                onUpdateUser(user, "name", e.target.value);
                              }
                            }}
                          />
                        </td>
                        <td data-label="Created">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td data-label="Actions">
                          {user.role !== "super_user" && (
                            <button className="btn-delete" onClick={() => onDeleteUser(user._id)}>
                              Delete
                            </button>
                          )}

                          {user.role !== "super_user" && (
                            <button
                              className={user.isDisabled ? "btn-save" : "btn-cancel"}
                              onClick={() => onToggleUserAccess(user)}
                            >
                              {user.isDisabled ? "Enable Login" : "Disable Login"}
                            </button>
                          )}

                          {pwdUserId === user._id ? (
                            <>
                              <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <button className="btn-save" onClick={() => onChangePassword(user._id)}>
                                Save
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={() => {
                                  setPwdUserId(null);
                                  setNewPassword("");
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button className="btn-edit" onClick={() => setPwdUserId(user._id)}>
                              Change Password
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="admin-muted">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserManagement;
