import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "../../../config/api";
import { AlertTriangle, RefreshCw, Settings, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../Documents.css";
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
    <div className="admin-storage-page">
      <h1>🗄️ Storage Administration</h1>

      {/* Summary cards */}
      {data?.summary && (
        <div className="admin-summary-cards">
          <div className="admin-card">
            <div className="admin-card-label">Total Users</div>
            <div className="admin-card-value">{data.summary.totalUsers}</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-label">Total Used</div>
            <div className="admin-card-value">{data.summary.totalUsedMB?.toFixed(1)} MB</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-label">Avg Usage</div>
            <div className="admin-card-value">{data.summary.avgUsedPercent}%</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-label">Over 80% Quota</div>
            <div className={`admin-card-value ${data.summary.usersOverEightyPercent > 0 ? "warning" : ""}`}>
              {data.summary.usersOverEightyPercent}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select className="drive-sort-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {["super_user","admin","hr","management","sales","support","it","digital_media"].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select className="drive-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="usedMB">Sort: Most Used</option>
          <option value="usedPercent">Sort: Usage %</option>
          <option value="fileCount">Sort: File Count</option>
          <option value="name">Sort: Name</option>
        </select>
        <button className="drive-btn drive-btn-ghost" onClick={fetch} style={{ padding: "6px 12px" }}>
          <RefreshCw size={13} style={{ verticalAlign: "middle" }} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="drive-loading"><div className="drive-spinner" /><span>Loading…</span></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Used / Quota</th>
                <th>Usage</th>
                <th>Files</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map(u => (
                <tr key={u.userId}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{u.name || "—"}</span>
                      {!u.storageProvisioned && (
                        <div className="unprovisioned-warn" title="Drive storage not provisioned">
                          <AlertTriangle size={13} />
                          <span>Not Provisioned</span>
                          <button
                            className="drive-btn drive-btn-ghost"
                            style={{ padding: "3px 10px", fontSize: "0.72rem" }}
                            disabled={retryingUserId === u.userId}
                            onClick={() => handleRetryProvision(u.userId, u.name)}
                          >
                            {retryingUserId === u.userId ? "Retrying…" : "Retry"}
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--nc-text-muted)" }}>{u.email}</div>
                  </td>
                  <td>
                    <span className="file-type-badge" style={{ color: getRoleColor(u.role), borderColor: getRoleColor(u.role) }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--nc-text-muted)" }}>
                    {u.usedMB?.toFixed(1)} / {u.quotaMB} MB
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <UsageBar pct={u.usedPercent} />
                  </td>
                  <td style={{ textAlign: "center" }}>{u.fileCount}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button 
                        className="file-action-btn" 
                        onClick={() => navigate(`/documents?userId=${u.userId}&userName=${encodeURIComponent(u.name || u.email)}`)} 
                        title="Open User's Drive"
                      >
                        <ExternalLink size={13} /> Open Drive
                      </button>
                      <button className="file-action-btn" onClick={() => setQuotaUser(u)} title="Manage quota">
                        <Settings size={13} /> Quota
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          <button className="file-action-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ fontSize: "0.8rem", color: "var(--nc-text-muted)" }}>Page {page} of {data.pagination.pages}</span>
          <button className="file-action-btn" disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {quotaUser && <QuotaModal user={quotaUser} onClose={handleQuotaUpdated} />}
    </div>
  );
};

export default StorageAdminPage;
