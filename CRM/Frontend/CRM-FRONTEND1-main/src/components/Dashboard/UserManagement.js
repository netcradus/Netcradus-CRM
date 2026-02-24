import React, { useCallback, useEffect, useState } from "react";
import { FaUsersCog } from "react-icons/fa";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./UserManagement.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "sales",
  });

  const [pwdUserId, setPwdUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const token = localStorage.getItem("token");

  // Fetch Users
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

  // Form Change
  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  // Create User
  const onCreateUser = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        apiUrl("/api/auth/users"),
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(res.data?.message || "User created successfully");

      // Reset form properly
      setForm({
        email: "",
        password: "",
        role: "sales",
      });

      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  // Delete User
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

  // Change Password
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

  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title">
        <FaUsersCog /> Admin User Management
      </h2>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-grid">

        {/* CREATE USER SECTION */}
        <section className="admin-card">
          <h3>Create New User</h3>

          <form onSubmit={onCreateUser} className="admin-form">
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

            <select
              name="role"
              value={form.role}
              onChange={onChange}
            >
              <option value="sales">Sales</option>
              <option value="support">Support</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="digital_media">Digital Media</option>
              <option value="admin">Admin</option>
            </select>

            <button type="submit">Create User</button>
          </form>
        </section>

        {/* USERS TABLE */}
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
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.userId || "-"}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          {/* DELETE BUTTON (NOT FOR ADMIN) */}
                          {user.role !== "admin" && (
                            <button
                              className="btn-delete"
                              onClick={() => onDeleteUser(user._id)}
                            >
                              🗑 Delete
                            </button>
                          )}

                          {/* CHANGE PASSWORD */}
                          {pwdUserId === user._id ? (
                            <>
                              <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) =>
                                  setNewPassword(e.target.value)
                                }
                              />

                              <button
                                className="btn-save"
                                onClick={() =>
                                  onChangePassword(user._id)
                                }
                              >
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
                            <button
                              className="btn-edit"
                              onClick={() =>
                                setPwdUserId(user._id)
                              }
                            >
                              Change Password
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="admin-muted">
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