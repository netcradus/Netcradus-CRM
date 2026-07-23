import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import axios from "axios";
import { Plus, Eye, EyeOff } from "lucide-react";
import { apiUrl } from "../../config/api";

const formatRoleLabel = (role = "") =>
  role === "admin"
    ? "Administrator"
    : String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const ManagerUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const managerName = localStorage.getItem("userName") || "Logged-in Manager";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
    department: "",
    designation: "",
    skipOnboarding: false,
  });

  const token = localStorage.getItem("token");

  // Fetch Team Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(apiUrl("/api/manager/users"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search Filter
  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase().trim();
    if (!needle) return users;

    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(needle) ||
        (u.email || "").toLowerCase().includes(needle) ||
        (u.role || "").toLowerCase().includes(needle) ||
        (u.designation || "").toLowerCase().includes(needle) ||
        (u.department || "").toLowerCase().includes(needle) ||
        (u.employeeId || "").toLowerCase().includes(needle)
    );
  }, [users, search]);

  // Create User Submission
  const onCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post(apiUrl("/api/manager/users"), form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Employee created successfully and linked to your team");
      setShowModal(false);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "sales",
        department: "",
        designation: "",
        skipOnboarding: false,
      });
      setShowCreatePassword(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">User Management</h1>
          <p className="subtitle">View your reporting team and create new employee accounts.</p>
        </div>

        <div
          className="page-header-right user-management-toolbar"
          style={{ display: "flex", gap: "var(--space-2)" }}
        >
          <div className="form-field" style={{ marginBottom: 0 }}>
            <input
              className="form-input"
              placeholder="Search team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "220px" }}
            />
          </div>

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Create User
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-6)",
          marginBottom: "var(--space-8)",
        }}
      >
        <div className="nc-stat-card">
          <span className="metric-label">Total Team Users</span>
          <span className="metric-value">{users.length}</span>
        </div>

        <div className="nc-stat-card">
          <span className="metric-label">Active Users</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>
            {users.filter((u) => u.status === "Active").length}
          </span>
        </div>

        <div className="nc-stat-card">
          <span className="metric-label">Disabled Users</span>
          <span className="metric-value" style={{ color: "var(--color-error)" }}>
            {users.filter((u) => u.status === "Disabled").length}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div
          className="badge badge-success"
          style={{
            marginBottom: "var(--space-4)",
            padding: "var(--space-2) var(--space-4)",
            width: "100%",
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          className="badge badge-error"
          style={{
            marginBottom: "var(--space-4)",
            padding: "var(--space-2) var(--space-4)",
            width: "100%",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--color-error)"
          }}
        >
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="nc-card">
        {loading ? (
          <div style={{ padding: "var(--space-6)", textAlign: "center" }}>Loading team records...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "var(--space-6)", textAlign: "center" }}>No team members found matching search.</div>
        ) : (
          <table className="nc-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Created On</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "var(--font-semibold)" }}>{u.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{u.email}</span>
                    </div>
                  </td>
                  <td>{u.employeeId || "-"}</td>
                  <td>
                    <span className="badge badge-ghost">{formatRoleLabel(u.role)}</span>
                  </td>
                  <td>{u.department || "General"}</td>
                  <td>{u.designation || "-"}</td>
                  <td>
                    <span className={`badge badge-${u.status === "Active" ? "success" : "error"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    {u.createdAt
                      ? formatInTimeZone(parseISO(u.createdAt), "Asia/Kolkata", "dd/MM/yyyy")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="nc-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "450px" }}
          >
            <div className="nc-modal-header">
              <h3>Create User</h3>
            </div>

            <form onSubmit={onCreateUser} className="form">
              {/* Full Name */}
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. Rohit Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  required
                  placeholder="e.g. rohit@netcradus.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="form-field">
                <label className="form-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="form-input"
                    type={showCreatePassword ? "text" : "password"}
                    required
                    placeholder="Enter onboarding password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{ paddingRight: "48px" }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowCreatePassword((curr) => !curr)}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "8px",
                      transform: "translateY(-50%)",
                      minHeight: "36px",
                      minWidth: "36px",
                      padding: 0,
                    }}
                  >
                    {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role Dropdown */}
              <div className="form-field">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="it">IT</option>
                  <option value="digital_media">Digital Media</option>
                </select>
              </div>

              {/* Department */}
              <div className="form-field">
                <label className="form-label">Department</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sales Department (Leave blank to use role default)"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>

              {/* Designation */}
              <div className="form-field">
                <label className="form-label">Designation</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sales Executive"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>

              {/* Reporting Manager (Fixed to logged-in Manager) */}
              <div className="form-field">
                <label className="form-label">Reporting Manager</label>
                <input
                  className="form-input"
                  disabled
                  value={managerName}
                  style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "not-allowed" }}
                />
              </div>

              {/* Skip Onboarding (Test Mode) */}
              <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
                <input
                  type="checkbox"
                  id="skipOnboarding"
                  checked={form.skipOnboarding}
                  onChange={(e) => setForm({ ...form, skipOnboarding: e.target.checked })}
                />
                <label htmlFor="skipOnboarding" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                  Test Account — Skip Onboarding
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create User
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
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

export default ManagerUserManagement;
