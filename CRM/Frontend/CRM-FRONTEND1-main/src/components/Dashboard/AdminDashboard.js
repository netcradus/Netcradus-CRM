import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "sales",
  });

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

  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title">Admin User Management</h2>

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
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.role}</td>
                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="admin-muted">No users found.</td>
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

export default AdminDashboard;
