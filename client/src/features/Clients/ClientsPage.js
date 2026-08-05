import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Search, ChevronRight, Edit3, Trash2, Archive, Eye, X, Briefcase, 
  RotateCcw, AlertCircle, Sparkles, HelpCircle, Check, DollarSign
} from "lucide-react";
import { clientApi } from "./clientApi";

const hasClientWriteAccess = (req, client) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  const userId = String(req.user?._id || req.user?.id || "");

  if (["super_user", "coo", "admin", "finance"].includes(role)) {
    return true;
  }

  if (role === "sales") {
    return (
      String(client.assignedSalesPerson?._id || client.assignedSalesPerson || "") === userId ||
      String(client.createdBy?._id || client.createdBy || "") === userId
    );
  }

  if (role === "manager") {
    return (
      String(client.assignedAccountManager?._id || client.assignedAccountManager || "") === userId ||
      String(client.createdBy?._id || client.createdBy || "") === userId
    );
  }

  return false;
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    prospects: 0,
    onHold: 0,
    inactiveClients: 0,
    totalContractValue: 0,
    pendingPayments: 0
  });

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Form State
  const defaultForm = {
    clientName: "",
    clientType: "Company",
    industry: "",
    website: "",
    companySize: "1-10",
    status: "Active",
    priority: "Medium",
    clientSource: "Other",
    contactPersonName: "",
    contactPersonDesignation: "",
    primaryEmail: "",
    primaryPhone: "",
    alternatePhone: "",
    preferredContactMethod: "Email",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    gstNumber: "",
    panNumber: "",
    registrationNumber: "",
    assignedAccountManager: "",
    assignedSalesPerson: "",
    contractStartDate: "",
    contractEndDate: "",
    contractValue: 0,
    billingType: "Fixed",
    paymentTerms: "Net 30",
    currency: "INR",
    paymentStatus: "Not Applicable",
    notes: "",
    tags: "",
    clientRating: 3,
    riskLevel: "Low",
    nextFollowUpDate: ""
  };
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);

  const currentUserRole = String(localStorage.getItem("userRole") || "").trim().toLowerCase();
  const currentUserId = localStorage.getItem("userId") || "";

  const showToast = (message) => {
    setToastMessage(message);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    return () => clearTimeout(toastTimeoutRef.current);
  }, []);

  // Handle modal escape key close and body scroll blocking
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const loadStats = useCallback(async () => {
    try {
      const res = await clientApi.stats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Stats Load Failed", err);
    }
  }, []);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim(),
        status: statusFilter,
        industry: industryFilter,
        assignedManager: managerFilter,
        clientType: clientTypeFilter,
        priority: priorityFilter,
        dateFrom,
        dateTo,
        page,
        limit,
        sortBy,
        sortOrder
      };
      const res = await clientApi.list(params);
      if (res.data.success) {
        setClients(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error("Clients Load Failed", err);
      showToast("Failed to fetch clients.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, industryFilter, managerFilter, clientTypeFilter, priorityFilter, dateFrom, dateTo, page, limit, sortBy, sortOrder]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await clientApi.users();
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Users Load Failed", err);
    }
  }, []);

  useEffect(() => {
    loadClients();
    loadStats();
  }, [loadClients, loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setIndustryFilter("");
    setManagerFilter("");
    setClientTypeFilter("");
    setPriorityFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleCardClick = (statusType) => {
    if (statusFilter === statusType) {
      setStatusFilter("");
    } else {
      setStatusFilter(statusType);
    }
    setPage(1);
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!form.clientName.trim()) {
      tempErrors.clientName = "Client name is required.";
    }
    if (!form.primaryEmail.trim()) {
      tempErrors.primaryEmail = "Primary email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primaryEmail)) {
      tempErrors.primaryEmail = "Invalid email address format.";
    }
    if (form.website && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(form.website)) {
      tempErrors.website = "Must be a valid URL starting with http:// or https://.";
    }
    if (form.contractStartDate && form.contractEndDate && new Date(form.contractEndDate) < new Date(form.contractStartDate)) {
      tempErrors.contractEndDate = "Contract end date cannot be before start date.";
    }
    if (form.contractValue < 0) {
      tempErrors.contractValue = "Contract value cannot be negative.";
    }
    if (form.clientRating < 1 || form.clientRating > 5) {
      tempErrors.clientRating = "Rating must be between 1 and 5.";
    }
    if (form.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.trim().toUpperCase())) {
      tempErrors.gstNumber = "Invalid GSTIN format (e.g. 22AAAAA1111A1Z1).";
    }
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.trim().toUpperCase())) {
      tempErrors.panNumber = "Invalid PAN format (e.g. ABCDE1234F).";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validateForm()) return;

    try {
      const payload = {
        ...form,
        contractValue: Number(form.contractValue),
        clientRating: Number(form.clientRating),
        gstNumber: form.gstNumber.trim().toUpperCase(),
        panNumber: form.panNumber.trim().toUpperCase(),
        assignedAccountManager: form.assignedAccountManager || null,
        assignedSalesPerson: form.assignedSalesPerson || null,
        contractStartDate: form.contractStartDate || null,
        contractEndDate: form.contractEndDate || null,
        nextFollowUpDate: form.nextFollowUpDate || null,
      };

      if (editingClient) {
        await clientApi.update(editingClient._id, payload);
        showToast("Client updated successfully.");
      } else {
        await clientApi.create(payload);
        showToast("Client created successfully.");
      }
      setShowModal(false);
      setForm(defaultForm);
      setEditingClient(null);
      loadClients();
      loadStats();
    } catch (err) {
      console.error(err);
      setApiError(err.response?.data?.message || "Operation failed.");
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setForm({
      ...defaultForm,
      ...client,
      assignedAccountManager: client.assignedAccountManager?._id || client.assignedAccountManager || "",
      assignedSalesPerson: client.assignedSalesPerson?._id || client.assignedSalesPerson || "",
      contractStartDate: client.contractStartDate ? client.contractStartDate.slice(0, 10) : "",
      contractEndDate: client.contractEndDate ? client.contractEndDate.slice(0, 10) : "",
      nextFollowUpDate: client.nextFollowUpDate ? client.nextFollowUpDate.slice(0, 10) : "",
    });
    setErrors({});
    setApiError("");
    setShowModal(true);
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Are you sure you want to archive this client? This will change status to Archived.")) return;
    try {
      await clientApi.archive(id);
      showToast("Client archived successfully.");
      loadClients();
      loadStats();
    } catch (err) {
      showToast("Failed to archive client.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("CRITICAL: Are you sure you want to permanently delete this client? This cannot be undone.")) return;
    try {
      await clientApi.remove(id);
      showToast("Client permanently deleted.");
      loadClients();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete client.");
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    const normalizedCurrency = String(currency || "INR")
      .trim()
      .toUpperCase()
      .replace(/\s*\(.*?\)\s*/g, "");

    const localeMap = {
      INR: "en-IN",
      USD: "en-US",
      EUR: "en-IE",
      GBP: "en-GB"
    };

    return new Intl.NumberFormat(localeMap[normalizedCurrency] || "en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "VIP": return "badge-danger";
      case "High": return "badge-warning";
      case "Medium": return "badge-success";
      default: return "badge-neutral";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Active": return "badge-success";
      case "Prospect": return "badge-info";
      case "On Hold": return "badge-warning";
      case "Inactive": return "badge-neutral";
      default: return "badge-neutral";
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <style>{`
        .client-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--color-bg-hover, #e2e8f0);
          background: var(--color-bg-surface, #ffffff);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
          color: var(--color-text-secondary);
        }
        .client-action-btn:hover {
          background: var(--color-bg-hover, #f1f5f9);
          color: var(--color-text-primary, #0f172a);
          border-color: var(--color-text-muted, #94a3b8);
        }
        .client-action-btn:focus-visible {
          outline: 2px solid var(--color-accent, #007bff);
          outline-offset: 2px;
        }
        .client-action-btn.btn-view:hover {
          border-color: var(--color-text-muted, #94a3b8);
          background: var(--color-bg-hover, #f1f5f9);
          color: var(--color-accent, #007bff);
        }
        .client-action-btn.btn-edit:hover {
          border-color: var(--color-accent, #007bff);
          background: rgba(0, 123, 255, 0.1);
          color: var(--color-accent, #007bff);
        }
        .client-action-btn.btn-archive:hover {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }
        .client-action-btn.btn-delete:hover {
          border-color: var(--color-error, #ef4444);
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error, #dc3545);
        }
      `}</style>
      {toastMessage && (
        <div className="chat-toast" role="alert" style={{ position: "fixed", top: "20px", right: "20px", zIndex: 1100 }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>CRM</span><ChevronRight size={10} /><span>Client Management</span>
          </div>
          <h1 className="title" style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)" }}>Client Management</h1>
          <p className="subtitle">Manage client profiles, contacts, projects, billing, and support relationships.</p>
        </div>
        {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
          <div className="page-header-right">
            <button className="btn btn-primary" onClick={() => { setEditingClient(null); setForm(defaultForm); setErrors({}); setApiError(""); setShowModal(true); }}>
              <Plus size={16} /> Add Client
            </button>
          </div>
        )}
      </div>

      {/* Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className={`nc-stat-card ${statusFilter === "" ? "active-card" : ""}`} onClick={() => handleCardClick("")} style={{ cursor: "pointer", borderLeft: "4px solid var(--color-accent)" }}>
          <span className="metric-label">Total Clients</span>
          <span className="metric-value">{stats.totalClients}</span>
        </div>
        <div className={`nc-stat-card ${statusFilter === "Active" ? "active-card" : ""}`} onClick={() => handleCardClick("Active")} style={{ cursor: "pointer", borderLeft: "4px solid var(--color-success)" }}>
          <span className="metric-label">Active Clients</span>
          <span className="metric-value">{stats.activeClients}</span>
        </div>
        <div className={`nc-stat-card ${statusFilter === "Prospect" ? "active-card" : ""}`} onClick={() => handleCardClick("Prospect")} style={{ cursor: "pointer", borderLeft: "4px solid var(--color-info)" }}>
          <span className="metric-label">Prospects</span>
          <span className="metric-value">{stats.prospects}</span>
        </div>
        <div className={`nc-stat-card ${statusFilter === "On Hold" ? "active-card" : ""}`} onClick={() => handleCardClick("On Hold")} style={{ cursor: "pointer", borderLeft: "4px solid var(--color-warning)" }}>
          <span className="metric-label">On Hold</span>
          <span className="metric-value">{stats.onHold}</span>
        </div>
        <div className="nc-stat-card" style={{ borderLeft: "4px solid var(--color-success)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span className="metric-label">Contract Value</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
            {Array.isArray(stats.totalContractValue) && stats.totalContractValue.length > 0 ? (
              stats.totalContractValue.map((item) => (
                <span key={item._id} className="metric-value" style={{ fontSize: "14px", fontWeight: "var(--font-bold)" }}>
                  {formatCurrency(item.totalVal, item._id)}
                </span>
              ))
            ) : (
              <span className="metric-value" style={{ fontSize: "16px" }}>
                {formatCurrency(0)}
              </span>
            )}
          </div>
        </div>
        <div className="nc-stat-card" style={{ borderLeft: "4px solid var(--color-warning)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span className="metric-label">Pending Payments</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
            {Array.isArray(stats.pendingPayments) && stats.pendingPayments.length > 0 ? (
              stats.pendingPayments.map((item) => (
                <span key={item._id} className="metric-value" style={{ fontSize: "14px", fontWeight: "var(--font-bold)" }}>
                  {formatCurrency(item.pendingVal, item._id)}
                </span>
              ))
            ) : (
              <span className="metric-value" style={{ fontSize: "16px" }}>
                {formatCurrency(0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input className="form-input" style={{ paddingLeft: "36px" }} placeholder="Search clients..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Prospect">Prospect</option>
            <option value="On Hold">On Hold</option>
            <option value="Archived">Archived</option>
          </select>

          <input className="form-input" placeholder="Filter by Industry..." value={industryFilter} onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }} />

          <select className="form-select" value={managerFilter} onChange={(e) => { setManagerFilter(e.target.value); setPage(1); }}>
            <option value="">All Managers</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name || u.email}</option>
            ))}
          </select>

          <select className="form-select" value={clientTypeFilter} onChange={(e) => { setClientTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="Company">Company</option>
            <option value="Individual">Individual</option>
          </select>

          <select className="form-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="VIP">VIP</option>
          </select>

          <button className="btn btn-ghost" onClick={resetFilters} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" }}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="nc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="nc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client Name</th>
                <th>Industry</th>
                <th>Contact</th>
                <th>Primary Email</th>
                <th>Assigned Manager</th>
                <th>Active Projects</th>
                <th>Contract Value</th>
                <th>Status</th>
                <th style={{ width: "170px", minWidth: "170px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "var(--space-10)" }}>
                    <div className="nc-loading">Loading clients data...</div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>
                    No client records found matching the criteria.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/clients/${c._id}`} className="badge badge-neutral" style={{ textDecoration: "none", fontWeight: "var(--font-semibold)", color: "var(--color-accent)" }}>
                        {c.clientId || "CL-XXX"}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: "var(--font-semibold)", color: "var(--color-text-primary)" }}>{c.clientName}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{c.clientType}</div>
                    </td>
                    <td>{c.industry || "—"}</td>
                    <td>
                      <div style={{ fontWeight: "var(--font-medium)" }}>{c.contactPersonName || "—"}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{c.primaryPhone || "—"}</div>
                    </td>
                    <td>
                      <a href={`mailto:${c.primaryEmail}`} style={{ color: "var(--color-text-primary)" }}>{c.primaryEmail}</a>
                    </td>
                    <td>
                      {c.assignedAccountManager?.name || c.assignedSalesPerson?.name || "Unassigned"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-neutral">{c.activeProjectsCount}</span>
                    </td>
                    <td>{formatCurrency(c.contractValue, c.currency)}</td>
                    <td>
                      <span className={`badge ${getStatusClass(c.status)}`}>{c.status}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Link to={`/clients/${c._id}`} className="client-action-btn btn-view" title="View Client" aria-label="View Client">
                          <Eye size={16} />
                        </Link>
                        {hasClientWriteAccess({ user: { role: currentUserRole, _id: currentUserId } }, c) && (
                          <button type="button" className="client-action-btn btn-edit" title="Edit Client" aria-label="Edit Client" onClick={() => handleEdit(c)}>
                            <Edit3 size={16} />
                          </button>
                        )}
                        {["super_user", "coo", "admin"].includes(currentUserRole) && c.status !== "Archived" && (
                          <button type="button" className="client-action-btn btn-archive" title="Archive Client" aria-label="Archive Client" onClick={() => handleArchive(c._id)}>
                            <Archive size={16} />
                          </button>
                        )}
                        {currentUserRole === "super_user" && (
                          <button type="button" className="client-action-btn btn-delete" title="Delete Client" aria-label="Delete Client" onClick={() => handleDelete(c._id)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Grid */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderTop: "1px solid var(--color-bg-hover)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                Previous
              </button>
              <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, padding: "var(--space-4)" }}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "90%", maxWidth: "800px", background: "var(--color-bg-surface)", borderRadius: "var(--border-radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div className="nc-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-bg-hover)", flexShrink: 0, background: "var(--color-bg-surface)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", margin: 0 }}>
                {editingClient ? `Edit Client Profile (${form.clientId})` : "Create New Client Master"}
              </h3>
              <button 
                type="button"
                className="btn btn-ghost close-modal-btn" 
                style={{ 
                  padding: 0, 
                  width: "36px", 
                  height: "36px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  borderRadius: "50%", 
                  border: "none", 
                  cursor: "pointer",
                  color: "var(--color-text)",
                  transition: "background-color 0.2s"
                }} 
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1, margin: 0 }}>
              <div className="nc-modal-body" style={{ overflowY: "auto", padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)", flex: 1 }}>
                {apiError && (
                  <div style={{ padding: "var(--space-3)", backgroundColor: "rgba(220,53,69,0.1)", color: "var(--color-error)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <AlertCircle size={16} />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* Basic Section */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                  <div className="form-field">
                    <label className="form-label">Client / Company Name *</label>
                    <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Enter corporate name or individual name" />
                    {errors.clientName && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.clientName}</span>}
                  </div>
                  <div className="form-field">
                    <label className="form-label">Client Type</label>
                    <select className="form-select" disabled={currentUserRole === "finance" && editingClient} value={form.clientType} onChange={(e) => setForm({ ...form, clientType: e.target.value })}>
                      <option value="Company">Company</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Client Source</label>
                    <select className="form-select" disabled={currentUserRole === "finance" && editingClient} value={form.clientSource} onChange={(e) => setForm({ ...form, clientSource: e.target.value })}>
                      <option value="Referral">Referral</option>
                      <option value="Website">Website</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Sales">Sales</option>
                      <option value="Campaign">Campaign</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Primary Contact Section */}
                <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "var(--space-3)", marginTop: 0 }}>Primary Contact</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label className="form-label">Contact Person Name</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} placeholder="e.g. Suresh Kumar" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Designation</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.contactPersonDesignation} onChange={(e) => setForm({ ...form, contactPersonDesignation: e.target.value })} placeholder="e.g. CTO / Product Manager" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Primary Email Address *</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} type="email" value={form.primaryEmail} onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })} placeholder="e.g. name@company.com" />
                      {errors.primaryEmail && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.primaryEmail}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">Primary Phone</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.primaryPhone} onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })} placeholder="e.g. +91 9988776655" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Alternate Phone</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Preferred Contact Method</label>
                      <select className="form-select" disabled={currentUserRole === "finance" && editingClient} value={form.preferredContactMethod} onChange={(e) => setForm({ ...form, preferredContactMethod: e.target.value })}>
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Business Info Section */}
                <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "var(--space-3)", marginTop: 0 }}>Business Information</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label className="form-label">Industry</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. FinTech, Healthcare" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Website</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" />
                      {errors.website && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.website}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">Company Size</label>
                      <select className="form-select" disabled={currentUserRole === "finance" && editingClient} value={form.companySize} onChange={(e) => setForm({ ...form, companySize: e.target.value })}>
                        <option value="1-10">1-10 Employees</option>
                        <option value="11-50">11-50 Employees</option>
                        <option value="51-200">51-200 Employees</option>
                        <option value="201-500">201-500 Employees</option>
                        <option value="500+">500+ Employees</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Client Status</label>
                      <select className="form-select" disabled={currentUserRole === "finance" && editingClient} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Prospect">Prospect</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Account Priority</label>
                      <select className="form-select" disabled={currentUserRole === "finance" && editingClient} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Risk Level</label>
                      <select className="form-select" disabled={currentUserRole === "finance" && editingClient} value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assignment Section */}
                {currentUserRole !== "finance" && (
                  <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                    <h4 style={{ fontSize: "12px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "var(--space-3)", marginTop: 0 }}>Assignment</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                      <div className="form-field">
                        <label className="form-label">Assigned Account Manager</label>
                        <select className="form-select" value={form.assignedAccountManager} onChange={(e) => setForm({ ...form, assignedAccountManager: e.target.value })}>
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>{u.name || u.email}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label">Assigned Sales Executive</label>
                        <select className="form-select" value={form.assignedSalesPerson} onChange={(e) => setForm({ ...form, assignedSalesPerson: e.target.value })}>
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>{u.name || u.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contract and Billing Section */}
                <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "var(--space-3)", marginTop: 0 }}>Contract & Billing</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label className="form-label">Contract Start Date</label>
                      <input className="form-input" type="date" value={form.contractStartDate} onChange={(e) => setForm({ ...form, contractStartDate: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Contract End Date</label>
                      <input className="form-input" type="date" value={form.contractEndDate} onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })} />
                      {errors.contractEndDate && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.contractEndDate}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">Contract Value</label>
                      <input className="form-input" type="number" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} />
                      {errors.contractValue && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.contractValue}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">Billing Type</label>
                      <select className="form-select" value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value })}>
                        <option value="Fixed">Fixed Cost</option>
                        <option value="Hourly">Hourly Rate</option>
                        <option value="Monthly">Monthly Retainer</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Payment Terms</label>
                      <select className="form-select" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
                        <option value="Net 7">Net 7 Days</option>
                        <option value="Net 15">Net 15 Days</option>
                        <option value="Net 30">Net 30 Days</option>
                        <option value="Net 45">Net 45 Days</option>
                        <option value="Custom">Custom Terms</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Currency</label>
                      <select className="form-select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Payment Status</label>
                      <select className="form-select" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                        <option value="Not Applicable">Not Applicable</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Legal and Tax Section */}
                <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "var(--space-3)", marginTop: 0 }}>Taxation & Registration</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label className="form-label">GSTIN Number</label>
                      <input className="form-input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} placeholder="e.g. 22AAAAA1111A1Z1" />
                      {errors.gstNumber && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.gstNumber}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">PAN Card Number</label>
                      <input className="form-input" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} placeholder="e.g. ABCDE1234F" />
                      {errors.panNumber && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.panNumber}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">Corporate Registration No.</label>
                      <input className="form-input" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="e.g. CIN/LLPIN" />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "var(--space-3)", marginTop: 0 }}>Address Details</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label className="form-label">Address Line 1</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Address Line 2</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">City</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">State / Province</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Country</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Postal / Zip Code</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Notes & Rating Section */}
                <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "var(--space-3)", marginTop: 0 }}>Management Notes</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div className="form-field">
                      <label className="form-label">Rating (1 to 5)</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} type="number" min="1" max="5" value={form.clientRating} onChange={(e) => setForm({ ...form, clientRating: Number(e.target.value) })} />
                      {errors.clientRating && <span style={{ color: "var(--color-error)", fontSize: "10px" }}>{errors.clientRating}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">Next Follow Up Date</label>
                      <input className="form-input" disabled={currentUserRole === "finance" && editingClient} type="date" value={form.nextFollowUpDate} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} />
                    </div>
                  </div>
                  {!editingClient && (
                    <div className="form-field">
                      <label className="form-label">Initial Note</label>
                      <textarea className="form-input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add any background notes about this client account..." />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="nc-modal-footer" style={{ display: "flex", gap: "var(--space-3)", padding: "16px 24px", borderTop: "1px solid var(--color-bg-hover)", background: "var(--color-bg-surface)", flexShrink: 0 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingClient ? "Save Updates" : "Create Master Record"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
