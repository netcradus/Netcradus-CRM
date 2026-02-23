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
    username: "",
    password: "",
    role: "sales",
  });


  const [pwdUserId, setPwdUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      setForm({ username: "", password: "", role: "sales" });
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

      setSuccess("User deleted");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const onChangePassword = async (id) => {
    try {
      await axios.put(
        apiUrl(`/api/auth/users/${id}/password`),
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Password updated");
      setPwdUserId(null);
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title"><FaUsersCog /> Admin User Management</h2>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-grid">
        <section className="admin-card">
          <h3>Create New User</h3>
          <form onSubmit={onCreateUser} className="admin-form">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="Username"
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
              <option value="sales">Sales</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
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
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>

                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.role}</td>
                        <td>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          {/* DELETE BUTTON */}
                          <button
                            className="btn-delete"
                            onClick={() => onDeleteUser(user._id)}
                          >
                            🗑 Delete
                          </button>

                          {/* PASSWORD CHANGE UI */}
                          {pwdUserId === user._id ? (
                            <>
                              <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />

                              <button
                                className="btn-save"
                                onClick={() => onChangePassword(user._id)}
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
                              onClick={() => setPwdUserId(user._id)}
                            >
                              Change Password
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="admin-muted">
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
