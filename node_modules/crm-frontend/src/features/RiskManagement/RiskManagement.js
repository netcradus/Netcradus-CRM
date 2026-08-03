import React, { useEffect, useState, useMemo, useCallback } from "react";
import { riskApi } from "./riskApi";
import {
  ShieldAlert,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  User,
  Info,
} from "lucide-react";

const CATEGORIES = ["Financial", "Operational", "Strategic", "Compliance", "Technical"];
const STATUS_OPTIONS = ["Identified", "Under Analysis", "Mitigated", "Closed", "On Hold"];
const TREATMENTS = ["Avoid", "Mitigate", "Transfer", "Accept"];

const PRIVILEGED_ROLES = ["super_user", "coo", "admin", "hr", "manager"];
const FULL_ACCESS_ROLES = ["super_user", "coo", "admin", "hr"];

const prettify = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const priorityBadge = (priority) => {
  const norm = String(priority || "").toLowerCase();
  if (norm === "critical" || norm === "high") return "error";
  if (norm === "medium") return "warning";
  return "info";
};

const statusBadge = (status) => {
  const norm = String(status || "").toLowerCase();
  switch (norm) {
    case "mitigated":
      return "success";
    case "closed":
      return "neutral";
    case "under_analysis":
      return "info";
    case "on_hold":
      return "warning";
    case "identified":
    default:
      return "ghost";
  }
};

const EMPTY_FORM = {
  risk: "",
  category: "Operational",
  likelihood: 3,
  impact: 3,
  owner: "",
  treatment: "Mitigate",
  status: "Identified",
  department: "",
};

export default function RiskManagement() {
  const role = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const currentUserId = localStorage.getItem("userId");

  const canWrite = PRIVILEGED_ROLES.includes(role);
  const canDelete = FULL_ACCESS_ROLES.includes(role);

  const [risks, setRisks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTasks: 0, limit: 10 });
  
  // Separate state for search input to implement debounce
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "", category: "" });
  const [stats, setStats] = useState({ total: 0, open: 0, high: 0, critical: 0, closed: 0 });
  const [activeCardFilter, setActiveCardFilter] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [viewingRisk, setViewingRisk] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Debounce search text input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch assignable owners
  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await riskApi.getAssignableUsers();
      setAssignableUsers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch assignable users", err);
    }
  }, []);

  // Fetch risks list
  const fetchRisks = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: pagination.limit,
          search: filters.search,
          category: filters.category,
        };

        // Combine summary card highlights with dropdown selectors
        if (activeCardFilter === "total") {
          if (filters.status) {
            params.status = filters.status;
          }
        } else if (activeCardFilter === "open") {
          params.status = "Open/Active";
        } else if (activeCardFilter === "closed") {
          params.status = "Closed/Resolved";
        } else if (activeCardFilter === "high") {
          params.priority = "high";
          if (filters.status) {
            params.status = filters.status;
          }
        } else if (activeCardFilter === "critical") {
          params.priority = "critical";
          if (filters.status) {
            params.status = filters.status;
          }
        } else {
          if (filters.status) {
            params.status = filters.status;
          }
        }

        const { data } = await riskApi.list(params);
        setRisks(data.data || []);
        setStats(data.stats || { total: 0, open: 0, high: 0, critical: 0, closed: 0 });
        setPagination((prev) => ({
          ...prev,
          currentPage: data.pagination?.currentPage || page,
          totalPages: data.pagination?.totalPages || 1,
          totalTasks: data.pagination?.totalTasks || 0,
        }));
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch risks");
      } finally {
        setLoading(false);
      }
    },
    [filters, activeCardFilter, pagination.limit]
  );

  // Trigger list refresh when filters or summary card filters change, resetting page to 1
  useEffect(() => {
    fetchRisks(1);
  }, [filters, activeCardFilter, fetchRisks]);

  useEffect(() => {
    if (canWrite) {
      fetchUsers();
    }
  }, [canWrite, fetchUsers]);

  const handleResetFilters = () => {
    setSearchInput("");
    setFilters({ search: "", status: "", category: "" });
    setActiveCardFilter(null);
  };

  const handleOpenCreate = () => {
    setEditingRisk(null);
    setForm({
      ...EMPTY_FORM,
      owner: currentUserId || (assignableUsers[0]?._id || ""),
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (riskItem) => {
    setEditingRisk(riskItem);
    setForm({
      risk: riskItem.risk || "",
      category: riskItem.category || "Operational",
      likelihood: riskItem.likelihood || 3,
      impact: riskItem.impact || 3,
      owner: riskItem.owner?._id || riskItem.owner || "",
      treatment: riskItem.treatment || "Mitigate",
      status: riskItem.status || "Identified",
      department: riskItem.department || "",
    });
    setShowFormModal(true);
  };

  const handleSaveRisk = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (editingRisk) {
        await riskApi.update(editingRisk._id, form);
        setSuccess("Risk updated successfully");
      } else {
        await riskApi.create(form);
        setSuccess("Risk created successfully");
      }
      setShowFormModal(false);
      fetchRisks(pagination.currentPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save risk details");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRisk = async (riskItem) => {
    if (!window.confirm(`Are you sure you want to delete Risk ${riskItem.riskId}?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await riskApi.delete(riskItem._id);
      setSuccess("Risk deleted successfully");
      fetchRisks(pagination.currentPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete risk");
    }
  };

  // Auto-calculated score preview inside the form
  const scorePreview = useMemo(() => {
    return form.likelihood * form.impact;
  }, [form.likelihood, form.impact]);

  const priorityPreview = useMemo(() => {
    const score = form.likelihood * form.impact;
    if (score >= 15) return "Critical";
    if (score >= 10) return "High";
    if (score >= 5) return "Medium";
    return "Low";
  }, [form.likelihood, form.impact]);

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div className="page-header-left">
          <h1 className="title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontFamily: "var(--font-heading)" }}>
            <ShieldAlert size={28} style={{ color: "var(--color-accent)" }} />
            Risk Management
          </h1>
          <p className="subtitle">Identify, analyze, track, and mitigate operational vulnerabilities.</p>
        </div>
        {canWrite && (
          <div className="page-header-right">
            <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
              <Plus size={16} /> Add Risk
            </button>
          </div>
        )}
      </div>

      {/* Scoped Summary Widgets */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div
          className="nc-stat-card"
          onClick={() => setActiveCardFilter((prev) => (prev === "total" ? null : "total"))}
          style={{
            cursor: "pointer",
            transition: "all var(--transition-base)",
            border: activeCardFilter === "total" ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
            boxShadow: activeCardFilter === "total" ? "var(--shadow-accent)" : "var(--shadow-md)",
          }}
        >
          <span className="metric-label">Total Risks</span>
          <span className="metric-value">{stats.total}</span>
        </div>
        <div
          className="nc-stat-card"
          onClick={() => setActiveCardFilter((prev) => (prev === "open" ? null : "open"))}
          style={{
            cursor: "pointer",
            transition: "all var(--transition-base)",
            border: activeCardFilter === "open" ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
            boxShadow: activeCardFilter === "open" ? "var(--shadow-accent)" : "var(--shadow-md)",
          }}
        >
          <span className="metric-label">Open / Active</span>
          <span className="metric-value" style={{ color: "var(--color-warning)" }}>
            {stats.open}
          </span>
        </div>
        <div
          className="nc-stat-card"
          onClick={() => setActiveCardFilter((prev) => (prev === "high" ? null : "high"))}
          style={{
            cursor: "pointer",
            transition: "all var(--transition-base)",
            border: activeCardFilter === "high" ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
            boxShadow: activeCardFilter === "high" ? "var(--shadow-accent)" : "var(--shadow-md)",
          }}
        >
          <span className="metric-label">High Priority</span>
          <span className="metric-value" style={{ color: "var(--color-accent)" }}>
            {stats.high}
          </span>
        </div>
        <div
          className="nc-stat-card"
          onClick={() => setActiveCardFilter((prev) => (prev === "critical" ? null : "critical"))}
          style={{
            cursor: "pointer",
            transition: "all var(--transition-base)",
            border: activeCardFilter === "critical" ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
            boxShadow: activeCardFilter === "critical" ? "var(--shadow-accent)" : "var(--shadow-md)",
          }}
        >
          <span className="metric-label">Critical Risks</span>
          <span className="metric-value" style={{ color: "var(--color-error)" }}>
            {stats.critical}
          </span>
        </div>
        <div
          className="nc-stat-card"
          onClick={() => setActiveCardFilter((prev) => (prev === "closed" ? null : "closed"))}
          style={{
            cursor: "pointer",
            transition: "all var(--transition-base)",
            border: activeCardFilter === "closed" ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
            boxShadow: activeCardFilter === "closed" ? "var(--shadow-accent)" : "var(--shadow-md)",
          }}
        >
          <span className="metric-label">Closed / Resolved</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>
            {stats.closed}
          </span>
        </div>
      </div>

      {/* Error & Success banners */}
      {error && (
        <div className="badge badge-error" style={{ width: "100%", padding: "var(--space-3) var(--space-4)", marginBottom: "var(--space-4)", whiteSpace: "normal" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="badge badge-success" style={{ width: "100%", padding: "var(--space-3) var(--space-4)", marginBottom: "var(--space-4)", whiteSpace: "normal" }}>
          {success}
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        className="nc-card"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-4)",
          padding: "var(--space-4)",
          marginBottom: "var(--space-6)",
          alignItems: "center",
        }}
      >
        <div className="form-field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <div className="topbar-search" style={{ margin: 0, width: "100%", height: "42px" }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: "var(--space-10)", height: "100%" }}
            />
          </div>
        </div>

        <div className="form-field" style={{ width: 180, marginBottom: 0 }}>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            style={{ height: "42px" }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field" style={{ width: 180, marginBottom: 0 }}>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{ height: "42px" }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-ghost" onClick={handleResetFilters} title="Reset filters" style={{ height: "42px", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <RotateCcw size={15} /> Reset
        </button>
      </div>

      {/* Data Table */}
      <div className="nc-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading Risk registry...
          </div>
        ) : (
          <div className="nc-table-wrapper">
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Risk ID</th>
                  <th>Risk Title</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Likelihood</th>
                  <th>Impact</th>
                  <th>Risk Score</th>
                  <th>Owner</th>
                  <th>Treatment</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {risks.length > 0 ? (
                  risks.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: "var(--font-bold)", color: "var(--color-text-primary)" }}>
                        {item.riskId}
                      </td>
                      <td style={{ fontWeight: "var(--font-medium)" }}>{item.risk}</td>
                      <td>{item.category}</td>
                      <td>{item.department || "General"}</td>
                      <td style={{ textAlign: "center" }}>{item.likelihood}</td>
                      <td style={{ textAlign: "center" }}>{item.impact}</td>
                      <td>
                        <span className={`badge badge-${priorityBadge(item.priority)}`} style={{ fontWeight: "var(--font-bold)" }}>
                          {item.riskScore} &middot; {item.priority}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <User size={13} style={{ color: "var(--color-text-muted)" }} />
                          <div>
                            <div style={{ fontSize: "var(--text-sm)" }}>{item.owner?.name || "Unassigned"}</div>
                            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.owner?.department}</div>
                          </div>
                        </div>
                      </td>
                      <td>{item.treatment}</td>
                      <td>
                        <span className={`badge badge-${statusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-1)" }}>
                          <button
                            className="action-button"
                            onClick={() => setViewingRisk(item)}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          {canWrite && (
                            <button
                              className="action-button"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit risk"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="action-button"
                              style={{ color: "var(--color-error)" }}
                              onClick={() => handleDeleteRisk(item)}
                              title="Delete risk"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" style={{ padding: 0 }}>
                      {/* Premium Empty State */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "var(--space-4)",
                          padding: "var(--space-16) var(--space-4)",
                        }}
                      >
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-text-muted)"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ opacity: 0.4 }}
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        <div style={{ textAlign: "center" }}>
                          <h4 style={{ color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-1)" }}>
                            No Risks Found
                          </h4>
                          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", maxWidth: "340px", margin: "0 auto" }}>
                            No risks matches your filters or assigned scope. Use "Reset" to clear filters or add a new risk.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && risks.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "var(--space-4) var(--space-6)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalTasks} total risks)
            </span>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                className="btn btn-ghost"
                disabled={pagination.currentPage === 1}
                onClick={() => fetchRisks(pagination.currentPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-ghost"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => fetchRisks(pagination.currentPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="nc-modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 560, borderRadius: "var(--radius-lg)" }}>
            <div className="nc-modal-header" style={{ padding: "var(--space-6) var(--space-6) var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-heading)" }}>
                {editingRisk ? `Edit Risk ${editingRisk.riskId}` : "Register New Risk"}
              </h3>
            </div>
            
            <form onSubmit={handleSaveRisk} style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Risk Statement / Title</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g., Data leakage due to legacy infrastructure APIs"
                  value={form.risk}
                  onChange={(e) => setForm({ ...form, risk: e.target.value })}
                  style={{ height: "42px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ height: "42px" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department Scope</label>
                  <input
                    className="form-input"
                    placeholder="e.g., IT, Operations, Legal"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    style={{ height: "42px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Likelihood</label>
                  <select
                    className="form-select"
                    value={form.likelihood}
                    onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })}
                    style={{ height: "42px" }}
                  >
                    <option value={1}>1 - Rare</option>
                    <option value={2}>2 - Unlikely</option>
                    <option value={3}>3 - Possible</option>
                    <option value={4}>4 - Likely</option>
                    <option value={5}>5 - Almost Certain</option>
                  </select>
                </div>

                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Impact</label>
                  <select
                    className="form-select"
                    value={form.impact}
                    onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                    style={{ height: "42px" }}
                  >
                    <option value={1}>1 - Insignificant</option>
                    <option value={2}>2 - Minor</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Major</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                </div>
              </div>

              {/* Professional Risk Score Preview Card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-4)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--color-bg-soft)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Risk Score</span>
                  <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", color: scorePreview >= 10 ? "var(--color-error)" : "var(--color-text-primary)" }}>
                    {scorePreview}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Priority Classification</span>
                  <span className={`badge badge-${priorityBadge(priorityPreview)}`} style={{ fontWeight: "var(--font-bold)", textTransform: "uppercase", fontSize: "10px" }}>
                    {priorityPreview}
                  </span>
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Risk Owner</label>
                <select
                  className="form-select"
                  required
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  style={{ height: "42px" }}
                >
                  <option value="">Select owner</option>
                  {assignableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.email} ({user.department || "General"}) - {prettify(user.role)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Treatment Response</label>
                  <select
                    className="form-select"
                    value={form.treatment}
                    onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                    style={{ height: "42px" }}
                  >
                    {TREATMENTS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ height: "42px" }}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: "42px" }} disabled={saving}>
                  {saving ? "Saving..." : "Save Risk"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, height: "42px" }} onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {viewingRisk && (
        <div className="nc-modal-overlay" onClick={() => setViewingRisk(null)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 540, borderRadius: "var(--radius-lg)" }}>
            <div className="nc-modal-header" style={{ padding: "var(--space-6) var(--space-6) var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-heading)" }}>Risk Details: {viewingRisk.riskId}</h3>
            </div>
            
            <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              <div>
                <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Risk Title</label>
                <div style={{ color: "var(--color-text-primary)", fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", lineHeight: "var(--leading-snug)" }}>
                  {viewingRisk.risk}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Category</label>
                  <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-medium)" }}>{viewingRisk.category}</div>
                </div>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Department</label>
                  <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-medium)" }}>{viewingRisk.department || "General"}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Score Matrix</label>
                  <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-medium)" }}>
                    {viewingRisk.riskScore} <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>(L:{viewingRisk.likelihood} × I:{viewingRisk.impact})</span>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Priority</label>
                  <span className={`badge badge-${priorityBadge(viewingRisk.priority)}`}>
                    {viewingRisk.priority}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Risk Owner</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-primary)", fontWeight: "var(--font-medium)" }}>
                    <User size={14} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div>{viewingRisk.owner?.name || "Unassigned"}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{viewingRisk.owner?.department}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Treatment Strategy</label>
                  <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-medium)" }}>{viewingRisk.treatment}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Created By</label>
                  <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-medium)" }}>{viewingRisk.createdBy?.name || "System"}</div>
                </div>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Status</label>
                  <span className={`badge badge-${statusBadge(viewingRisk.status)}`}>
                    {viewingRisk.status}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Created Date</label>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    {new Date(viewingRisk.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ color: "var(--color-text-muted)" }}>Last Updated</label>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    {new Date(viewingRisk.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nc-modal-footer" style={{ borderTop: "1px solid var(--color-border)", padding: "var(--space-4) var(--space-6) var(--space-6)" }}>
              <button className="btn btn-ghost" onClick={() => setViewingRisk(null)} style={{ width: "100%", height: "42px" }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
