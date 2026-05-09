import React, { useCallback, useEffect, useState, useMemo } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import axios from "axios";
import { Plus, Trash2, Key, ShieldCheck, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { apiUrl } from "../../config/api";

const formatRoleLabel = (role = "") =>
  role === "admin" ? "Administrator" : String(role).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales" });
  const [pwdUserId, setPwdUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const token = localStorage.getItem("token");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl("/api/auth/users"), { headers: { Authorization: `Bearer ${token}` } });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setError("Failed to load users"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase();
    return users.filter(u => (u.name||"").toLowerCase().includes(needle) || (u.email||"").toLowerCase().includes(needle) || (u.role||"").toLowerCase().includes(needle));
  }, [users, search]);

  const onCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(apiUrl("/api/auth/users"), form, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess("User created successfully");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "sales" });
      setShowCreatePassword(false);
      fetchUsers();
    } catch (err) { setError("Failed to create user"); }
  };

  const onChangePassword = async (id) => {
    if (!newPassword) return;
    try {
      await axios.put(apiUrl(`/api/auth/users/${id}/password`), { password: newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess("Password updated");
      setPwdUserId(null);
      setNewPassword("");
      setShowResetPassword(false);
    } catch (err) { setError("Failed to update password"); }
  };

  const onToggleUserAccess = async (user) => {
    try {
      await axios.patch(apiUrl(`/api/auth/users/${user._id}/access`), { isDisabled: !user.isDisabled, reason: user.isDisabled ? "" : "Disabled by Admin" }, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) { setError("Access update failed"); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">User Management</h1>
          <p className="subtitle">Manage user accounts, roles and access permissions.</p>
        </div>
        <div className="page-header-right user-management-toolbar" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
             <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '200px' }} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create User
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Total Users</span>
          <span className="metric-value">{users.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Now</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{users.filter(u => !u.isDisabled).length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Disabled Accounts</span>
          <span className="metric-value" style={{ color: 'var(--color-error)' }}>{users.filter(u => u.isDisabled).length}</span>
        </div>
      </div>

      {success && <div className="badge badge-success" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', width: '100%' }}>{success}</div>}

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u._id}>
                <td>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'var(--font-semibold)' }}>{u.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{u.email}</span>
                   </div>
                </td>
                <td><span className={`badge badge-ghost`}>{formatRoleLabel(u.role)}</span></td>
                <td>
                  <span className={`badge badge-${u.isDisabled ? 'error' : 'success'}`}>
                    {u.isDisabled ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td>{u.createdAt ? formatInTimeZone(parseISO(u.createdAt), "Asia/Kolkata", "dd/MM/yyyy") : "-"}</td>
                <td>
                   <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <button className="btn btn-ghost" onClick={() => onToggleUserAccess(u)} title={u.isDisabled ? "Enable" : "Disable"}>
                        {u.isDisabled ? <ShieldCheck size={16} color="var(--color-success)" /> : <ShieldAlert size={16} color="var(--color-warning)" />}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setPwdUserId(u._id)} title="Reset Password"><Key size={16} /></button>
                      {u.role !== 'super_user' && (
                        <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={async () => {
                          if(window.confirm("Delete user?")) {
                            await axios.delete(apiUrl(`/api/auth/users/${u._id}`), { headers: { Authorization: `Bearer ${token}` } });
                            fetchUsers();
                          }
                        }}><Trash2 size={16} /></button>
                      )}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="nc-modal-header"><h3>Create New User</h3></div>
            <form onSubmit={onCreateUser} className="form">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-field">
                <label className="form-label">Temporary Password</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" type={showCreatePassword ? "text" : "password"} required value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ paddingRight: "48px" }} />
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreatePassword((current) => !current)} style={{ position: "absolute", top: "50%", right: "8px", transform: "translateY(-50%)", minHeight: "36px", minWidth: "36px", padding: 0 }}>
                    {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                   <option value="admin">Administrator</option><option value="management">Management</option><option value="sales">Sales</option><option value="support">Support</option><option value="hr">HR</option><option value="it">IT</option><option value="digital_media">Digital Media</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create User</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pwdUserId && (
        <div className="nc-modal-overlay" onClick={() => setPwdUserId(null)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="nc-modal-header"><h3>Reset Password</h3></div>
            <div className="form">
              <div className="form-field">
                <label className="form-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" type={showResetPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: "48px" }} />
                  <button type="button" className="btn btn-ghost" onClick={() => setShowResetPassword((current) => !current)} style={{ position: "absolute", top: "50%", right: "8px", transform: "translateY(-50%)", minHeight: "36px", minWidth: "36px", padding: 0 }}>
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onChangePassword(pwdUserId)}>Update Password</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPwdUserId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
