import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FileText, Plus, Search, FileSpreadsheet, Trash2, Archive, Upload,
  BookOpen, UserCheck, Download, ChevronLeft, History, Calendar, Info, CheckCircle2, AlertCircle, FileUp, X
} from "lucide-react";
import { apiUrl } from "../../config/api";

const DEPARTMENTS = [
  "HR", "Sales", "Support", "IT", "Digital Media", "Management", "COO", "General"
];

const ROLES = [
  { value: "super_user", label: "Super User" },
  { value: "admin", label: "Admin" },
  { value: "hr", label: "HR Manager" },
  { value: "management", label: "Management" },
  { value: "manager", label: "Manager" },
  { value: "sales", label: "Sales Representative" },
  { value: "support", label: "Support Agent" },
  { value: "it", label: "IT Administrator" },
  { value: "digital_media", label: "Digital Media Expert" },
  { value: "coo", label: "COO" }
];

const CATEGORIES = [
  { value: "hr", label: "HR Policy" },
  { value: "leave", label: "Leave & Time-Off" },
  { value: "attendance", label: "Attendance & Punctuality" },
  { value: "work_from_home", label: "Work From Home" },
  { value: "it_security", label: "IT & Information Security" },
  { value: "finance", label: "Finance & Expenses" },
  { value: "code_of_conduct", label: "Code of Conduct" },
  { value: "data_privacy", label: "Data Privacy & GDPR" },
  { value: "travel", label: "Business Travel" },
  { value: "general", label: "General Guidelines" }
];

const STATUS_BADGES = {
  draft: "badge-ghost",
  published: "badge-primary",
  archived: "badge-error",
  expired: "badge-warning"
};

const Policies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("userRole")?.trim()?.toLowerCase();
  const userId = localStorage.getItem("userId");
  
  const isHRorAdmin = ["super_user", "admin", "hr"].includes(userRole);

  // Read subroutes or actions from URL query / pathname
  const isCreate = location.pathname === "/policies/create";
  const isEdit = location.pathname.endsWith("/edit");
  const matchId = location.pathname.split("/")[2];
  const activeId = (matchId && matchId !== "create") ? matchId : null;

  // View state: 'list' | 'form' | 'detail' | 'report'
  const [view, setView] = useState("list");
  
  // Data States
  const [policies, setPolicies] = useState([]);
  const [policyDetail, setPolicyDetail] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Form States
  const [form, setForm] = useState({
    title: "",
    policyCode: "",
    category: "general",
    shortDescription: "",
    content: "",
    version: "1.0",
    effectiveDate: "",
    expiryDate: "",
    applicableToAll: true,
    applicableDepartments: [],
    applicableRoles: [],
    attachments: []
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [ackChecked, setAckChecked] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState({});
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, archived: 0, pending: 0 });

  // Token Auth headers
  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  }), []);

  // Sync route layout matching
  useEffect(() => {
    if (isCreate) {
      setForm({
        title: "",
        policyCode: "",
        category: "general",
        shortDescription: "",
        content: "",
        version: "1.0",
        effectiveDate: new Date().toISOString().substring(0, 10),
        expiryDate: "",
        applicableToAll: true,
        applicableDepartments: [],
        applicableRoles: [],
        attachments: []
      });
      setView("form");
    } else if (isEdit && activeId) {
      fetchPolicyForEdit(activeId);
    } else if (activeId) {
      fetchPolicyDetails(activeId);
    } else {
      setView("list");
      fetchPoliciesList();
      if (!isHRorAdmin) {
        fetchPendingSignatureCount();
      }
    }
  }, [location.pathname, activeId]);

  // Load backend policies list
  const fetchPoliciesList = async () => {
    setLoading(true);
    try {
      let url = `/api/policies?search=${search}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const { data } = await axios.get(apiUrl(url), authHeaders);
      if (data.success) {
        setPolicies(data.data);
        calculateDashboardStats(data.data);
      }
    } catch (err) {
      setErrorMessage("Failed to load policies database.");
    } finally {
      setLoading(false);
    }
  };

  // Get employee specific signature requirements count
  const fetchPendingSignatureCount = async () => {
    try {
      const { data } = await axios.get(apiUrl("/api/policies/my/pending"), authHeaders);
      if (data.success) {
        setStats(prev => ({ ...prev, pending: data.data.length }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate local statistics for badges
  const calculateDashboardStats = (list) => {
    const total = list.length;
    const published = list.filter(p => p.status === "published").length;
    const draft = list.filter(p => p.status === "draft").length;
    const archived = list.filter(p => p.status === "archived").length;
    
    setStats(prev => ({
      ...prev,
      total,
      published,
      draft,
      archived
    }));
  };

  // Fetch item for edit
  const fetchPolicyForEdit = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(apiUrl(`/api/policies/${id}`), authHeaders);
      if (data.success) {
        const item = data.data;
        setForm({
          title: item.title,
          policyCode: item.policyCode,
          category: item.category,
          shortDescription: item.shortDescription || "",
          content: item.content,
          version: item.version,
          effectiveDate: item.effectiveDate ? item.effectiveDate.substring(0, 10) : "",
          expiryDate: item.expiryDate ? item.expiryDate.substring(0, 10) : "",
          applicableToAll: item.applicableToAll,
          applicableDepartments: item.applicableDepartments || [],
          applicableRoles: item.applicableRoles || [],
          attachments: item.attachments || []
        });
        setView("form");
      }
    } catch (err) {
      setErrorMessage("Could not load policy details for edit.");
      navigate("/policies");
    } finally {
      setLoading(false);
    }
  };

  // Fetch full details and history
  const fetchPolicyDetails = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(apiUrl(`/api/policies/${id}`), authHeaders);
      if (data.success) {
        setPolicyDetail(data.data);
        setAckChecked(false);
        setView("detail");
      }
    } catch (err) {
      setErrorMessage("You are not authorized to view this policy.");
      navigate("/policies");
    } finally {
      setLoading(false);
    }
  };

  // Load detailed compliance reports
  const fetchComplianceReport = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(apiUrl(`/api/policies/${id}/acknowledgements`), authHeaders);
      if (data.success) {
        setReportData(data);
        setView("report");
      }
    } catch (err) {
      setErrorMessage("Failed to load compliance details report.");
    } finally {
      setLoading(false);
    }
  };

  // Document view/download handler with auth headers
  const handleDownload = async (docId, filename, inline = false) => {
    const key = `${docId}-${inline ? 'view' : 'download'}`;
    if (downloadingIds[key]) return; // prevent duplicate requests

    setDownloadingIds(prev => ({ ...prev, [key]: true }));
    setErrorMessage("");

    try {
      const endpoint = apiUrl(inline ? `/api/documents/view/${docId}` : `/api/documents/download/${docId}`);
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob"
      });

      const contentType = response.headers["content-type"] || "application/octet-stream";

      // Parse JSON errors returned inside Blobs
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const errJson = JSON.parse(text);
        setErrorMessage(errJson.message || "Failed to download or view the document.");
        setDownloadingIds(prev => ({ ...prev, [key]: false }));
        return;
      }

      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = window.URL.createObjectURL(blob);

      if (inline) {
        // Open PDF or media inline in a new tab
        const newTab = window.open(objectUrl, "_blank", "noopener,noreferrer");
        if (!newTab) {
          alert("Pop-up blocked. Please enable pop-ups to view this attachment.");
        }
        // Let the browser load the stream, then revoke
        setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 12000);
      } else {
        // Save file locally
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename || "attachment";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      console.error("Document download error:", err);
      setErrorMessage("Unable to fetch attachment from server.");
    } finally {
      setDownloadingIds(prev => ({ ...prev, [key]: false }));
    }
  };

  // Document uploader helper
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("document", file);

    try {
      const { data } = await axios.post(apiUrl(`/api/documents/upload/${userId}`), formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      if (data.success) {
        const doc = data.data;
        setForm(prev => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              filename: doc.filename,
              path: doc.path,
              mimetype: doc.mimetype,
              size: doc.size,
              documentId: doc._id
            }
          ]
        }));
        setSuccessMessage("File attached successfully.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Remove file reference from state
  const handleRemoveAttachment = (idx) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  // Multi select utilities
  const toggleSelectDept = (dept) => {
    setForm(prev => {
      const exists = prev.applicableDepartments.includes(dept);
      return {
        ...prev,
        applicableDepartments: exists
          ? prev.applicableDepartments.filter(d => d !== dept)
          : [...prev.applicableDepartments, dept]
      };
    });
  };

  const toggleSelectRole = (roleVal) => {
    setForm(prev => {
      const exists = prev.applicableRoles.includes(roleVal);
      return {
        ...prev,
        applicableRoles: exists
          ? prev.applicableRoles.filter(r => r !== roleVal)
          : [...prev.applicableRoles, roleVal]
      };
    });
  };

  // Form Submit (Save as Draft)
  const handleSaveForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Basic frontend validator
    if (!form.title || !form.policyCode || !form.content || !form.effectiveDate) {
      setErrorMessage("Please complete all required fields.");
      setLoading(false);
      return;
    }

    try {
      if (isEdit && activeId) {
        const { data } = await axios.patch(apiUrl(`/api/policies/${activeId}`), form, authHeaders);
        if (data.success) {
          setSuccessMessage("Saved successfully.");
          setTimeout(() => navigate("/policies"), 1000);
        }
      } else {
        const { data } = await axios.post(apiUrl("/api/policies"), form, authHeaders);
        if (data.success) {
          setSuccessMessage("Draft created successfully.");
          setTimeout(() => navigate("/policies"), 1000);
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Error saving policy document.");
    } finally {
      setLoading(false);
    }
  };

  // Publish policy directly
  const handlePublishPolicy = async (policyId) => {
    if (!window.confirm("Publishing this policy will trigger real-time notifications to all applicable employees. Continue?")) return;
    setLoading(true);
    try {
      const { data } = await axios.post(apiUrl(`/api/policies/${policyId}/publish`), {}, authHeaders);
      if (data.success) {
        setSuccessMessage("Policy published successfully.");
        if (view === "detail") {
          fetchPolicyDetails(policyId);
        } else {
          fetchPoliciesList();
        }
      }
    } catch (err) {
      setErrorMessage("Publication failed.");
    } finally {
      setLoading(false);
    }
  };

  // Archive policy directly
  const handleArchivePolicy = async (policyId) => {
    if (!window.confirm("Are you sure you want to archive this policy? New signatures will not be accepted.")) return;
    setLoading(true);
    try {
      const { data } = await axios.post(apiUrl(`/api/policies/${policyId}/archive`), {}, authHeaders);
      if (data.success) {
        setSuccessMessage("Policy archived successfully.");
        if (view === "detail") {
          fetchPolicyDetails(policyId);
        } else {
          fetchPoliciesList();
        }
      }
    } catch (err) {
      setErrorMessage("Archiving failed.");
    } finally {
      setLoading(false);
    }
  };

  // Delete draft policy
  const handleDeleteDraft = async (policyId) => {
    if (!window.confirm("Are you sure you want to permanently delete this draft policy?")) return;
    setLoading(true);
    try {
      const { data } = await axios.delete(apiUrl(`/api/policies/${policyId}`), authHeaders);
      if (data.success) {
        setSuccessMessage("Draft deleted successfully.");
        navigate("/policies");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Deletion failed.");
    } finally {
      setLoading(false);
    }
  };

  // Submit acknowledgement signature
  const handleAcknowledge = async () => {
    if (!ackChecked) return;
    setLoading(true);
    try {
      const { data } = await axios.post(apiUrl(`/api/policies/${activeId}/acknowledge`), {}, authHeaders);
      if (data.success) {
        setSuccessMessage("Policy acknowledged successfully.");
        fetchPolicyDetails(activeId);
      }
    } catch (err) {
      setErrorMessage("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  // Export checklist report to CSV
  const triggerCSVExport = () => {
    if (!reportData || !reportData.data.length) return;
    const policy = policyDetail;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Email,Department,Designation,Status,Acknowledged At,IP Address,User Agent\r\n";
    
    reportData.data.forEach(row => {
      const cleanUA = (row.userAgent || "").replace(/"/g, '""');
      csvContent += `"${row.userId}","${row.name}","${row.email}","${row.department}","${row.designation}","${row.status}","${row.acknowledgedAt || ''}","${row.ipAddress || ''}","${cleanUA}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `compliance_${policy.policyCode}_v${policy.version}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* Messages */}
      {errorMessage && (
        <div className="badge badge-error" style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", width: "100%", justifyContent: "flex-start", gap: "var(--space-2)" }}>
          <AlertCircle size={16} /> <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="badge badge-success" style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", width: "100%", justifyContent: "flex-start", gap: "var(--space-2)" }}>
          <CheckCircle2 size={16} /> <span>{successMessage}</span>
        </div>
      )}

      {/* ────────────────── VIEW A: LIST OF POLICIES ────────────────── */}
      {view === "list" && (
        <div>
          {/* Header */}
          <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
            <div className="page-header-left">
              <h1 className="title">Policy Management</h1>
              <p className="subtitle">Publish company policies, guidelines, and track compliance signatures.</p>
            </div>
            {isHRorAdmin && (
              <button className="btn btn-primary" onClick={() => navigate("/policies/create")}>
                <Plus size={18} /> New Policy
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-4" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Total Policies</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", marginTop: "var(--space-1)" }}>{stats.total}</div>
            </div>
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Published</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", color: "var(--color-accent)", marginTop: "var(--space-1)" }}>{stats.published}</div>
            </div>
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Drafts</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", marginTop: "var(--space-1)" }}>{stats.draft}</div>
            </div>
            {!isHRorAdmin ? (
              <div className="nc-card" style={{ padding: "var(--space-4)", borderLeft: stats.pending > 0 ? "4px solid var(--color-error)" : "none" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Pending Action</div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", color: stats.pending > 0 ? "var(--color-error)" : "var(--color-success)", marginTop: "var(--space-1)" }}>
                  {stats.pending} {stats.pending > 0 ? "Signature Needed" : "All Signed"}
                </div>
              </div>
            ) : (
              <div className="nc-card" style={{ padding: "var(--space-4)" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Archived</div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", marginTop: "var(--space-1)" }}>{stats.archived}</div>
              </div>
            )}
          </div>

          {/* Filters Area */}
          <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search code or title..."
                  className="form-input"
                  style={{ paddingLeft: "36px", width: "100%" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select className="form-select" style={{ width: "180px" }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              {isHRorAdmin && (
                <select className="form-select" style={{ width: "150px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              )}

              <button className="btn btn-primary" onClick={fetchPoliciesList} disabled={loading}>
                Apply Filters
              </button>
            </div>
          </div>

          {/* Listing Table */}
          <div className="nc-card" style={{ overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>Loading policies...</div>
            ) : policies.length === 0 ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>No policies matching query.</div>
            ) : (
              <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                    <th style={{ padding: "var(--space-3)" }}>Policy</th>
                    <th style={{ padding: "var(--space-3)" }}>Code</th>
                    <th style={{ padding: "var(--space-3)" }}>Category</th>
                    <th style={{ padding: "var(--space-3)" }}>Version</th>
                    <th style={{ padding: "var(--space-3)" }}>Applicability</th>
                    <th style={{ padding: "var(--space-3)" }}>Effective Date</th>
                    <th style={{ padding: "var(--space-3)" }}>Status</th>
                    <th style={{ padding: "var(--space-3)", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map(p => {
                    const categoryLabel = CATEGORIES.find(c => c.value === p.category)?.label || p.category;
                    const cleanDate = p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : "-";
                    return (
                      <tr key={p._id} style={{ borderBottom: "1px solid var(--color-border)" }} className="clickable-row">
                        <td style={{ padding: "var(--space-3)", fontWeight: "500" }}>{p.title}</td>
                        <td style={{ padding: "var(--space-3)" }}><code style={{ fontSize: "var(--text-xs)" }}>{p.policyCode}</code></td>
                        <td style={{ padding: "var(--space-3)" }}>{categoryLabel}</td>
                        <td style={{ padding: "var(--space-3)" }}>v{p.version}</td>
                        <td style={{ padding: "var(--space-3)" }}>
                          {p.applicableToAll ? (
                            <span className="badge badge-success">Company-Wide</span>
                          ) : (
                            <span style={{ fontSize: "var(--text-xs)" }}>
                              {p.applicableDepartments?.length || 0} depts / {p.applicableRoles?.length || 0} roles
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "var(--space-3)" }}>{cleanDate}</td>
                        <td style={{ padding: "var(--space-3)" }}>
                          <span className={`badge ${STATUS_BADGES[p.status] || "badge-ghost"}`}>{p.status}</span>
                        </td>
                        <td style={{ padding: "var(--space-3)", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "var(--space-2)" }}>
                            <button className="btn btn-ghost" style={{ padding: "var(--space-1) var(--space-2)", height: "28px", fontSize: "11px" }} onClick={() => navigate(`/policies/${p._id}`)}>
                              View
                            </button>
                            {isHRorAdmin && p.status === "draft" && (
                              <button className="btn btn-ghost" style={{ padding: "var(--space-1) var(--space-2)", height: "28px", fontSize: "11px" }} onClick={() => navigate(`/policies/${p._id}/edit`)}>
                                Edit
                              </button>
                            )}
                            {isHRorAdmin && p.status === "published" && (
                              <>
                                <button className="btn btn-ghost" style={{ padding: "var(--space-1) var(--space-2)", height: "28px", fontSize: "11px", color: "var(--color-accent)" }} onClick={() => navigate(`/policies/${p._id}/edit`)}>
                                  Revise
                                </button>
                                <button className="btn btn-ghost" style={{ padding: "var(--space-1) var(--space-2)", height: "28px", fontSize: "11px" }} onClick={() => fetchComplianceReport(p._id)}>
                                  Report
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── VIEW B: CREATION / EDITING FORM ────────────────── */}
      {view === "form" && (
        <div className="nc-card" style={{ padding: "var(--space-6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
            <button className="btn btn-ghost" onClick={() => navigate("/policies")}>
              <ChevronLeft size={18} /> Back
            </button>
            <h2 style={{ fontSize: "var(--text-xl)", margin: 0 }}>
              {isEdit ? `Edit Policy Draft: ${form.policyCode}` : "Create Policy Document"}
            </h2>
          </div>

          <form onSubmit={handleSaveForm} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
              <div className="form-field">
                <label className="form-label">Policy Title <span style={{ color: "var(--color-error)" }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Employee Work From Home Policy"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-2" style={{ gap: "var(--space-3)" }}>
                <div className="form-field">
                  <label className="form-label">Policy Code <span style={{ color: "var(--color-error)" }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. POL-HR-002"
                    value={form.policyCode}
                    onChange={(e) => setForm(prev => ({ ...prev, policyCode: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Version</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1.0"
                    value={form.version}
                    onChange={(e) => setForm(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
              <div className="form-field">
                <label className="form-label">Category <span style={{ color: "var(--color-error)" }}>*</span></label>
                <select className="form-select" value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="grid grid-2" style={{ gap: "var(--space-3)" }}>
                <div className="form-field">
                  <label className="form-label">Effective Date <span style={{ color: "var(--color-error)" }}>*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={form.effectiveDate}
                    onChange={(e) => setForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.expiryDate}
                    onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Short Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Provide a brief summary of what this policy contains..."
                value={form.shortDescription}
                onChange={(e) => setForm(prev => ({ ...prev, shortDescription: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Policy Content (Rich Text) <span style={{ color: "var(--color-error)" }}>*</span></label>
              <textarea
                className="form-input"
                style={{ minHeight: "220px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}
                required
                placeholder="Enter HTML or Plain Text policy details here..."
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            {/* Target Audience Filters */}
            <div className="nc-card" style={{ padding: "var(--space-4)", background: "var(--color-bg-surface-hover)" }}>
              <h3 style={{ fontSize: "var(--text-sm)", margin: "0 0 var(--space-3) 0", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Info size={16} /> Target Audience Settings
              </h3>
              
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.applicableToAll}
                    onChange={(e) => setForm(prev => ({ ...prev, applicableToAll: e.target.checked }))}
                  />
                  <span>Apply to all active employees (Company-Wide)</span>
                </label>
              </div>

              {!form.applicableToAll && (
                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-field">
                    <label className="form-label">Target Departments</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                      {DEPARTMENTS.map(d => {
                        const active = form.applicableDepartments.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            className={`btn ${active ? "btn-primary" : "btn-ghost"}`}
                            style={{ height: "28px", fontSize: "11px", padding: "0 var(--space-2)" }}
                            onClick={() => toggleSelectDept(d)}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Target Roles</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                      {ROLES.map(r => {
                        const active = form.applicableRoles.includes(r.value);
                        return (
                          <button
                            key={r.value}
                            type="button"
                            className={`btn ${active ? "btn-primary" : "btn-ghost"}`}
                            style={{ height: "28px", fontSize: "11px", padding: "0 var(--space-2)" }}
                            onClick={() => toggleSelectRole(r.value)}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="form-field">
              <label className="form-label">Upload Policy Attachments (PDF/Word/Images)</label>
              <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                <label className="btn btn-ghost" style={{ cursor: "pointer", display: "inline-flex", gap: "var(--space-2)" }}>
                  <FileUp size={16} /> {uploading ? "Uploading..." : "Attach File"}
                  <input
                    type="file"
                    style={{ display: "none" }}
                    disabled={uploading}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {form.attachments.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                  {form.attachments.map((file, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "var(--text-xs)" }}>{file.filename} ({Math.round(file.size / 1024)} KB)</span>
                      <button type="button" className="btn btn-ghost" style={{ height: "24px", width: "24px", padding: 0, color: "var(--color-error)" }} onClick={() => handleRemoveAttachment(idx)}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Save as Draft
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/policies")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────── VIEW C: DETAILS & SIGNATURE SCREEN ────────────────── */}
      {view === "detail" && policyDetail && (
        <div className="nc-card" style={{ padding: "var(--space-6)" }}>
          {/* Top Panel Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", alignItems: "center", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => navigate("/policies")}>
              <ChevronLeft size={18} /> Back
            </button>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {isHRorAdmin && policyDetail.status === "draft" && (
                <>
                  <button className="btn btn-ghost" onClick={() => navigate(`/policies/${policyDetail._id}/edit`)}>
                    Edit Draft
                  </button>
                  <button className="btn btn-primary" onClick={() => handlePublishPolicy(policyDetail._id)}>
                    Publish Policy
                  </button>
                  <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => handleDeleteDraft(policyDetail._id)}>
                    Delete
                  </button>
                </>
              )}
              {isHRorAdmin && policyDetail.status === "published" && (
                <>
                  <button className="btn btn-ghost" onClick={() => handleArchivePolicy(policyDetail._id)}>
                    Archive
                  </button>
                  <button className="btn btn-ghost" onClick={() => fetchComplianceReport(policyDetail._id)}>
                    View Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details body */}
          <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)" }}>
              <div>
                <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>{policyDetail.title}</h1>
                <p style={{ color: "var(--color-text-muted)", margin: "var(--space-1) 0 0 0" }}>
                  Code: <code style={{ fontSize: "var(--text-xs)" }}>{policyDetail.policyCode}</code> | Version: v{policyDetail.version}
                </p>
              </div>
              <span className={`badge ${STATUS_BADGES[policyDetail.status] || "badge-ghost"}`}>{policyDetail.status}</span>
            </div>

            <div className="grid grid-3" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Category</span>
                <div style={{ fontWeight: "500" }}>{CATEGORIES.find(c => c.value === policyDetail.category)?.label || policyDetail.category}</div>
              </div>
              <div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Effective Date</span>
                <div style={{ fontWeight: "500" }}>{new Date(policyDetail.effectiveDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Target Scope</span>
                <div style={{ fontWeight: "500" }}>{policyDetail.applicableToAll ? "Company-Wide" : "Filtered Selection"}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {policyDetail.shortDescription && (
            <div style={{ background: "var(--color-bg-surface-hover)", padding: "var(--space-4)", borderRadius: "12px", marginBottom: "var(--space-6)", borderLeft: "4px solid var(--color-accent)" }}>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Summary</div>
              <p style={{ margin: "var(--space-1) 0 0 0", fontSize: "var(--text-sm)" }}>{policyDetail.shortDescription}</p>
            </div>
          )}

          {/* HTML Content */}
          <div style={{ marginBottom: "var(--space-8)" }}>
            <h3 style={{ fontSize: "var(--text-sm)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>Policy Details</h3>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: policyDetail.content }} />
          </div>

          {/* Attachments downloads */}
          {policyDetail.attachments?.length > 0 && (
            <div style={{ marginBottom: "var(--space-8)" }}>
              <h3 style={{ fontSize: "var(--text-sm)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>Attachments</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {policyDetail.attachments.map(att => {
                  const isViewing = !!downloadingIds[`${att.documentId}-view`];
                  const isDownloading = !!downloadingIds[`${att.documentId}-download`];
                  return (
                    <div key={att.documentId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) var(--space-4)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "var(--text-xs)" }}>{att.filename} ({Math.round(att.size / 1024)} KB)</span>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                          className="btn btn-ghost"
                          style={{ display: "inline-flex", gap: "var(--space-2)", height: "28px", fontSize: "11px" }}
                          disabled={isViewing || isDownloading}
                          onClick={() => handleDownload(att.documentId, att.filename, true)}
                        >
                          <BookOpen size={14} /> {isViewing ? "Viewing..." : "View"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ display: "inline-flex", gap: "var(--space-2)", height: "28px", fontSize: "11px" }}
                          disabled={isViewing || isDownloading}
                          onClick={() => handleDownload(att.documentId, att.filename, false)}
                        >
                          <Download size={14} /> {isDownloading ? "Downloading..." : "Download"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acknowledgement Status Indicator */}
          {policyDetail.status === "published" && (
            <div className="nc-card" style={{ padding: "var(--space-6)", border: "1px solid var(--color-border)" }}>
              {policyDetail.userAcknowledgement ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-success)", fontWeight: "bold", marginBottom: "var(--space-2)" }}>
                    <CheckCircle2 size={20} /> Policy Signed & Acknowledged
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    You signed version v{policyDetail.userAcknowledgement.policyVersion} of this policy on {new Date(policyDetail.userAcknowledgement.acknowledgedAt).toLocaleString()}.
                  </p>
                </div>
              ) : isHRorAdmin && policyDetail.createdBy?._id === userId ? (
                <div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                    Signatures compliance logs are active. Scroll or switch view to run compliance checks.
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: "var(--text-md)", margin: "0 0 var(--space-3) 0" }}>Sign Policy Acknowledgement</h3>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer", marginBottom: "var(--space-4)" }}>
                    <input
                      type="checkbox"
                      checked={ackChecked}
                      onChange={(e) => setAckChecked(e.target.checked)}
                    />
                    <span style={{ fontSize: "var(--text-sm)" }}>I have read, understood, and agree to comply with the terms of this policy document.</span>
                  </label>
                  <div>
                    <button className="btn btn-primary" disabled={!ackChecked || loading} onClick={handleAcknowledge}>
                      Acknowledge Policy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Version history list */}
          {policyDetail.versionHistory?.length > 1 && (
            <div style={{ marginTop: "var(--space-8)" }}>
              <h3 style={{ fontSize: "var(--text-sm)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-4)" }}>Version History</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {policyDetail.versionHistory.map(v => (
                  <div key={v._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-xs)" }}>v{v.version} - {v.title}</span>
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                      <span className={`badge ${STATUS_BADGES[v.status] || "badge-ghost"}`} style={{ fontSize: "10px" }}>{v.status}</span>
                      <button className="btn btn-ghost" style={{ padding: "0 var(--space-2)", height: "24px", fontSize: "10px" }} onClick={() => navigate(`/policies/${v._id}`)}>
                        View version
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────── VIEW D: COMPLIANCE REPORT SECTION ────────────────── */}
      {view === "report" && reportData && (
        <div>
          {/* Header Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <button className="btn btn-ghost" onClick={() => fetchPolicyDetails(activeId)}>
                <ChevronLeft size={18} /> Back
              </button>
              <h2 style={{ fontSize: "var(--text-xl)", margin: 0 }}>Compliance Signature Audit Report</h2>
            </div>
            <button className="btn btn-ghost" style={{ display: "inline-flex", gap: "var(--space-2)" }} onClick={triggerCSVExport}>
              <FileSpreadsheet size={16} /> Export to CSV
            </button>
          </div>

          {/* Policy Info Card */}
          {policyDetail && (
            <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-base)", margin: "0 0 var(--space-2) 0" }}>{policyDetail.title}</h3>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "var(--text-xs)" }}>
                Code: <code>{policyDetail.policyCode}</code> | Version: v{policyDetail.version}
              </p>
            </div>
          )}

          {/* Grid Stats */}
          <div className="grid grid-4" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Total Target Staff</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", marginTop: "var(--space-1)" }}>{reportData.summary.total}</div>
            </div>
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Acknowledged</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", color: "var(--color-success)", marginTop: "var(--space-1)" }}>{reportData.summary.acknowledged}</div>
            </div>
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Pending Signature</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", color: "var(--color-warning)", marginTop: "var(--space-1)" }}>{reportData.summary.pending}</div>
            </div>
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Completion Progress</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: "bold", color: "var(--color-accent)", marginTop: "var(--space-1)" }}>{reportData.summary.completionRate}%</div>
            </div>
          </div>

          {/* Department breakdown table */}
          <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--text-md)", margin: "0 0 var(--space-4) 0" }}>Department breakdown</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
              {Object.entries(reportData.departmentBreakdown || {}).map(([dept, breakd]) => {
                const completion = breakd.total > 0 ? Math.round((breakd.acknowledged * 100) / breakd.total) : 0;
                return (
                  <div key={dept} style={{ padding: "var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "var(--text-sm)" }}>{dept}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                      {breakd.acknowledged} / {breakd.total} Signed ({completion}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Employee compliance table */}
          <div className="nc-card" style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-3)" }}>ID</th>
                  <th style={{ padding: "var(--space-3)" }}>Name</th>
                  <th style={{ padding: "var(--space-3)" }}>Email</th>
                  <th style={{ padding: "var(--space-3)" }}>Department</th>
                  <th style={{ padding: "var(--space-3)" }}>Designation</th>
                  <th style={{ padding: "var(--space-3)" }}>Signature Status</th>
                  <th style={{ padding: "var(--space-3)" }}>Date & Details</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map(emp => (
                  <tr key={emp.employeeId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "var(--space-3)" }}><code>{emp.userId}</code></td>
                    <td style={{ padding: "var(--space-3)", fontWeight: "500" }}>{emp.name}</td>
                    <td style={{ padding: "var(--space-3)" }}>{emp.email}</td>
                    <td style={{ padding: "var(--space-3)" }}>{emp.department}</td>
                    <td style={{ padding: "var(--space-3)" }}>{emp.designation}</td>
                    <td style={{ padding: "var(--space-3)" }}>
                      <span className={`badge ${emp.status === "acknowledged" ? "badge-success" : "badge-warning"}`}>
                        {emp.status === "acknowledged" ? "Acknowledged" : "Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-3)", fontSize: "var(--text-xs)" }}>
                      {emp.status === "acknowledged" ? (
                        <div>
                          <div>Signed: {new Date(emp.acknowledgedAt).toLocaleDateString()}</div>
                          <div style={{ color: "var(--color-text-muted)" }}>IP: {emp.ipAddress || "N/A"}</div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
