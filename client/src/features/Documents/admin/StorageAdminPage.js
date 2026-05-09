import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "../../../config/api";
import { AlertTriangle, RefreshCw, Settings, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import "../Documents.css";

import QuotaModal from "./QuotaModal";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const getRoleColor = (role) => {
  const map = { super_user: "#ff4f9a", admin: "#3b82f6", hr: "#22c55e", management: "#f59e0b", sales: "#8b5cf6", it: "#06b6d4", support: "#f97316", digital_media: "#ec4899" };
  return map[role] || "#8892a4";
};

const UsageBar = ({ pct }) => {
  const color = pct >= 90 ? "red" : pct >= 70 ? "yellow" : "green";
  return (
    <div className="admin-usage-bar">
      <div className="admin-usage-track">
        <div className={`admin-usage-fill ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`admin-usage-pct`} style={{ color: pct >= 90 ? "#f87171" : pct >= 70 ? "#fbbf24" : "#4ade80" }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
};

const StorageAdminPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("usedMB");
  const [page, setPage] = useState(1);
  const [retryingUserId, setRetryingUserId] = useState(null);

  const navigate = useNavigate();

  const [quotaUser, setQuotaUser] = useState(null); // { userId, name, ... } for QuotaModal

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25, sortBy });
      if (roleFilter) params.set("role", roleFilter);
      const { data: res } = await axios.get(apiUrl(`/api/documents/admin/storage?${params}`), { headers: authHeaders() });
      setData(res);
    } catch (err) {
      console.error("Admin storage fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, roleFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRetryProvision = async (userId, name) => {
    setRetryingUserId(userId);
    try {
      await axios.post(apiUrl(`/api/documents/admin/user/${userId}/provision`), {}, { headers: authHeaders() });
      alert(`✅ Storage provisioned for ${name}.`);
      fetch();
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.message || "Unknown error"}`);
    } finally {
      setRetryingUserId(null);
    }
  };

  const handleQuotaUpdated = () => {
    setQuotaUser(null);
    fetch();
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Storage Administration</h1>
          <p className="subtitle">Monitor disk usage, manage quotas, and provision user storage.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={fetch} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {data?.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div className="nc-stat-card">
            <span className="metric-label">Total Users</span>
            <span className="metric-value">{data.summary.totalUsers}</span>
          </div>
          <div className="nc-stat-card">
            <span className="metric-label">Total Used</span>
            <span className="metric-value">{data.summary.totalUsedMB?.toFixed(1)} MB</span>
          </div>
          <div className="nc-stat-card">
            <span className="metric-label">Avg Usage</span>
            <span className="metric-value">{data.summary.avgUsedPercent}%</span>
          </div>
          <div className="nc-stat-card">
            <span className="metric-label">Critical Usage (80%+)</span>
            <span className="metric-value" style={{ color: data.summary.usersOverEightyPercent > 0 ? 'var(--color-error)' : 'inherit' }}>
              {data.summary.usersOverEightyPercent}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div className="form-field" style={{ width: '200px', marginBottom: 0 }}>
             <label className="form-label">Filter by Role</label>
             <select className="form-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
                <option value="">All Roles</option>
                {["super_user","admin","hr","management","sales","support","it","digital_media"].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
             </select>
          </div>
          <div className="form-field" style={{ width: '200px', marginBottom: 0 }}>
             <label className="form-label">Sort By</label>
             <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="usedMB">Most Used</option>
                <option value="usedPercent">Usage %</option>
                <option value="fileCount">File Count</option>
                <option value="name">Name</option>
             </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="nc-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="nc-table">
            <thead>
              <tr>
                <th>User Information</th>
                <th>Role</th>
                <th>Capacity</th>
                <th>Usage Bar</th>
                <th style={{ textAlign: 'center' }}>Files</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading storage data...</td></tr>
              ) : (data?.data || []).map(u => (
                <tr key={u.userId}>
                  <td>
                    <div style={{ fontWeight: 'var(--font-semibold)' }}>{u.name || "Unknown User"}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{u.email}</div>
                    {!u.storageProvisioned && (
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-error)', fontSize: '10px' }}>
                        <AlertTriangle size={10} /> Not Provisioned
                        <button className="btn btn-ghost btn--sm" disabled={retryingUserId === u.userId} onClick={() => handleRetryProvision(u.userId, u.name)}>
                          {retryingUserId === u.userId ? "..." : "Retry"}
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${getRoleColor(u.role)}20`, color: getRoleColor(u.role), borderColor: getRoleColor(u.role), border: '1px solid' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 'var(--text-sm)' }}>{u.usedMB?.toFixed(1)} MB</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>of {u.quotaMB} MB</div>
                  </td>
                  <td style={{ minWidth: '180px' }}>
                    <UsageBar pct={u.usedPercent} />
                  </td>
                  <td style={{ textAlign: 'center' }}>{u.fileCount}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" onClick={() => navigate(`/documents?userId=${u.userId}&userName=${encodeURIComponent(u.name || u.email)}`)} title="Open Drive">
                        <ExternalLink size={14} />
                      </button>
                      <button className="btn btn-ghost" onClick={() => setQuotaUser(u)} title="Manage Quota">
                        <Settings size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.pages > 1 && (
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-4)' }}>
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Page {page} of {data.pagination.pages}</span>
            <button className="btn btn-ghost" disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {quotaUser && <QuotaModal user={quotaUser} onClose={handleQuotaUpdated} />}
    </div>
  );
};

export default StorageAdminPage;
