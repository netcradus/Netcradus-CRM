import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { Plus, Search, Eye, Edit, Trash2, Globe, Server, Layers, FileText, X } from "lucide-react";
import { apiUrl } from "../../config/api";
import DomainManagementForm from "./DomainManagementForm";
import DomainDetailsModal from "./DomainDetailsModal";
import "./domainManagement.css";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const HOSTING_FILTER_OPTIONS = [
  "DigitalOcean",
  "AWS",
  "Vercel",
  "Netlify",
  "Render",
  "Railway",
  "Hostinger",
  "Other"
];

export default function DomainManagementPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [owners, setOwners] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHosting, setSelectedHosting] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");

  const [activeCardFilter, setActiveCardFilter] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const ownerDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target)) {
        setIsOwnerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Disable body scroll when form modal is open
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFormOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFormOpen(false);
      }
    };
    if (isFormOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(apiUrl("/api/domain-management"), { headers: getHeaders() });
      setRecords(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch domain records:", err);
      setError("Failed to load domain records.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/auth/users"), { headers: getHeaders() });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOwners(list.filter((u) => u.isActive !== false && u.role !== "partner"));
    } catch (err) {
      console.error("Failed to load owners filter list:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchOwners();
  }, [fetchRecords, fetchOwners]);

  // Handle Save (Add/Edit)
  const handleSave = (savedRecord) => {
    fetchRecords(); // Refresh data to update metrics and listings
  };

  // Delete Action
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this domain record?");
    if (!confirmDelete) return;

    try {
      await axios.delete(apiUrl(`/api/domain-management/${id}`), { headers: getHeaders() });
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Failed to delete record:", err);
      alert(err.response?.data?.message || "Failed to delete record.");
    }
  };

  // Compute stats
  const stats = useMemo(() => {
    const totalDomains = records.length;
    const uniqueProjects = new Set(records.map((r) => r.project?.trim().toLowerCase()).filter(Boolean)).size;
    const uniqueHostings = new Set(records.map((r) => r.hosting?.trim().toLowerCase()).filter(Boolean)).size;

    return {
      totalProjects: uniqueProjects,
      totalDomains,
      totalHosting: uniqueHostings
    };
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search matches Project, Domain, Repository, Hosting, Owner Name
      const matchesSearch = searchQuery
        ? [
            r.project,
            r.domain,
            r.repository,
            r.hosting,
            r.ownerUser?.name
          ].some((val) => val?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      // Filter by Hosting
      let matchesHosting = true;
      if (selectedHosting) {
        if (selectedHosting === "Other") {
          // If "Other" filter is selected, match anything not in the predefined HOSTING_FILTER_OPTIONS list
          matchesHosting = !HOSTING_FILTER_OPTIONS.slice(0, -1).includes(r.hosting);
        } else {
          matchesHosting = r.hosting === selectedHosting;
        }
      }

      // Filter by Owner User ID
      const matchesOwner = selectedOwner ? r.ownerUser?._id === selectedOwner : true;

      // Filter by Clicked Card
      let matchesCard = true;
      if (activeCardFilter === "projects") {
        matchesCard = true;
      } else if (activeCardFilter === "domains") {
        matchesCard = true;
      } else if (activeCardFilter === "hostings") {
        matchesCard = !!r.hosting;
      }

      return matchesSearch && matchesHosting && matchesOwner && matchesCard;
    });
  }, [records, searchQuery, selectedHosting, selectedOwner, activeCardFilter]);

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header" style={{ marginBottom: "var(--space-6)", alignItems: "center" }}>
        <div className="page-header-left">
          <h1 className="title">Domain Management</h1>
          <p className="subtitle">Manage project domains, repositories and deployments.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search project, domain, repository, developer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '220px', height: '36px' }}
          />

          <select 
            className="form-select" 
            value={selectedHosting}
            onChange={(e) => setSelectedHosting(e.target.value)}
            style={{ width: '130px', height: '36px' }}
          >
            <option value="">Hosting</option>
            {HOSTING_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <div ref={ownerDropdownRef} style={{ position: 'relative', width: '150px' }}>
            <div 
              className="form-input" 
              onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedOwner ? (owners.find(o => o._id === selectedOwner)?.name || "Developer") : "Developer"}
              </span>
              <span style={{ fontSize: '10px', marginLeft: '6px', opacity: 0.6 }}>▼</span>
            </div>
            {isOwnerDropdownOpen && (
              <div 
                className="nc-card" 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 1000, 
                  marginTop: '4px', 
                  maxHeight: '240px', 
                  overflowY: 'auto', 
                  background: 'var(--color-bg-surface-strong, #1f1f1f)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div 
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textAlign: 'left' }}
                  onClick={() => { setSelectedOwner(""); setIsOwnerDropdownOpen(false); }}
                >
                  All Developers
                </div>
                {owners.map(o => (
                  <div 
                    key={o._id}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', textAlign: 'left' }}
                    onClick={() => { setSelectedOwner(o._id); setIsOwnerDropdownOpen(false); }}
                  >
                    {o.name || o.email}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="button" className="btn btn-primary" onClick={handleAddClick} style={{ height: '36px', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div 
          className={`nc-stat-card clickable-card ${activeCardFilter === "projects" ? "active" : ""}`}
          onClick={() => setActiveCardFilter(activeCardFilter === "projects" ? null : "projects")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveCardFilter(activeCardFilter === "projects" ? null : "projects"); } }}
        >
          <span className="metric-label">TOTAL PROJECTS</span>
          <span className="metric-value">{stats.totalProjects}</span>
        </div>
        <div 
          className={`nc-stat-card clickable-card ${activeCardFilter === "domains" ? "active" : ""}`}
          onClick={() => setActiveCardFilter(activeCardFilter === "domains" ? null : "domains")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveCardFilter(activeCardFilter === "domains" ? null : "domains"); } }}
        >
          <span className="metric-label">TOTAL DOMAINS</span>
          <span className="metric-value">{stats.totalDomains}</span>
        </div>
        <div 
          className={`nc-stat-card clickable-card ${activeCardFilter === "hostings" ? "active" : ""}`}
          onClick={() => setActiveCardFilter(activeCardFilter === "hostings" ? null : "hostings")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveCardFilter(activeCardFilter === "hostings" ? null : "hostings"); } }}
        >
          <span className="metric-label">HOSTING PROVIDERS</span>
          <span className="metric-value">{stats.totalHosting}</span>
        </div>
      </div>

      {error && (
        <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)", border: "1px solid var(--color-error)", background: "rgba(239, 68, 68, 0.05)" }}>
          <p style={{ color: "var(--color-error)", margin: 0 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="nc-card" style={{ padding: "var(--space-12)", textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto var(--space-4) auto" }}></div>
          <p style={{ color: "var(--color-text-muted)" }}>Loading records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="nc-card" style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-text-muted)" }}>
          <FileText size={48} style={{ marginBottom: "var(--space-4)", opacity: 0.2 }} />
          <h3 style={{ margin: "0 0 var(--space-2) 0", color: "var(--color-text-primary)" }}>No domain records found.</h3>
          <p style={{ marginBottom: "var(--space-6)" }}>Start by adding a new record to manage project deployments.</p>
          <button type="button" className="btn btn-primary" onClick={handleAddClick}>
            <Plus size={16} /> Add Record
          </button>
        </div>
      ) : (
        <div className="nc-card" style={{ overflowX: "auto" }}>
          <table className="nc-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Project</th>
                <th>Domain</th>
                <th>Repository</th>
                <th>Frontend</th>
                <th>Backend</th>
                <th>API</th>
                <th>Hosting</th>
                <th>Developer</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: "var(--font-semibold)", textAlign: "left" }}>{r.project}</td>
                  <td>
                    <span className="domain-badge">{r.domain}</span>
                  </td>
                  <td>
                    <a href={r.repository} className="clickable-link" target="_blank" rel="noopener noreferrer">Repo</a>
                  </td>
                  <td>
                    <a href={r.frontend} className="clickable-link" target="_blank" rel="noopener noreferrer">Frontend</a>
                  </td>
                  <td>
                    <a href={r.backend} className="clickable-link" target="_blank" rel="noopener noreferrer">Backend</a>
                  </td>
                  <td>
                    <a href={r.api} className="clickable-link" target="_blank" rel="noopener noreferrer">API</a>
                  </td>
                  <td>{r.hosting}</td>
                  <td>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>{r.ownerUser?.name || "—"}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {r.ownerUser?.userId ? `${r.ownerUser.userId}` : ""}
                      {r.ownerUser?.department ? ` • ${r.ownerUser.department}` : ""}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => setViewingRecord(r)}
                        title="View Details"
                        style={{ padding: "6px" }}
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleEditClick(r)}
                        title="Edit"
                        style={{ padding: "6px" }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleDelete(r._id)}
                        title="Delete"
                        style={{ padding: "6px", color: "var(--color-error)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="domain-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="domain-modal" role="dialog" aria-modal="true">
            <div className="domain-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-text-primary)" }}>
                  {editingRecord?._id ? "Edit Domain Record" : "Add Domain Record"}
                </h2>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Enter the project domain and deployment details.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "var(--space-1)" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="domain-modal-body">
              <DomainManagementForm 
                record={editingRecord}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
                onSubmittingChange={setIsFormSubmitting}
              />
            </div>
            <div className="domain-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={isFormSubmitting}>Cancel</button>
              <button type="submit" form="domain-mgmt-form" className="btn btn-primary" disabled={isFormSubmitting}>
                {isFormSubmitting ? "Saving..." : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingRecord && (
        <div className="domain-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingRecord(null); }}>
          <div className="domain-modal" role="dialog" aria-modal="true">
            <div className="domain-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-text-primary)" }}>
                  Project Details
                </h2>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Detailed project URLs, hosting and developer information.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingRecord(null)} 
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "var(--space-1)" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="domain-modal-body">
              <DomainDetailsModal 
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
              />
            </div>
            <div className="domain-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewingRecord(null)}>Close</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  const recordToEdit = viewingRecord;
                  setViewingRecord(null);
                  handleEditClick(recordToEdit);
                }}
              >
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
