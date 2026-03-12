import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import "./Leads.css";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { FaClipboardList, FaFilter } from "react-icons/fa";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [pagination, setPagination] = useState({
    totalLeads: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  });
  const [users, setUsers] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Selection state for bulk delete
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(null); // { type, count, action }

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // CSV Mapping State
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    name: "",
    email: "",
    phone: "",
    company: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "In Progress",
    notes: "",
    assignedTo: ""
  });

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const LEAD_STATUSES = ["Closed", "In Progress", "Not Interested"];

  const updateFilter = useCallback((paramsToUpdate, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      
      if (typeof paramsToUpdate === "string") {
        if (value) next.set(paramsToUpdate, value);
        else next.delete(paramsToUpdate);
      } else {
        // Handle multiple updates
        Object.keys(paramsToUpdate).forEach(key => {
          if (paramsToUpdate[key]) next.set(key, paramsToUpdate[key]);
          else next.delete(key);
        });
      }

      // Always reset to page 1 when filters change (unless updating page itself)
      if (typeof paramsToUpdate === "string" && paramsToUpdate !== "page") {
        next.set("page", "1");
      } else if (typeof paramsToUpdate === "object" && !paramsToUpdate.page) {
        next.set("page", "1");
      }

      return next;
    });
  }, [setSearchParams]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      // Read directly from the URL (window.location) to always get the freshest params
      const urlParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlParams.entries());
      const response = await axios.get(apiUrl("/api/leads"), { params });
      
      if (response.data.success) {
        setLeads(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setLeads(Array.isArray(response.data) ? response.data : []);
      }
      setError("");
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err.response?.data?.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []); // No deps — reads URL directly each time

  // Fetch leads when searchParams change
  useEffect(() => {
    fetchLeads();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, fetchLeads]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter("search", searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, updateFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(apiUrl("/api/auth/users"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
    }
  }, [token]);

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers();
    }
  }, [userRole, fetchUsers]);

  // No longer needed as we filter on server
  const activeLeads = leads;

  // ─── Selection helpers ───────────────────────────────────────────
  const isAllPageSelected = activeLeads.length > 0 && activeLeads.every(l => selectedLeads.has(l._id));

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedLeads(prev => {
        const next = new Set(prev);
        activeLeads.forEach(l => next.delete(l._id));
        return next;
      });
    } else {
      setSelectedLeads(prev => {
        const next = new Set(prev);
        activeLeads.forEach(l => next.add(l._id));
        return next;
      });
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedLeads(new Set());

  // ─── Bulk delete handlers ────────────────────────────────────────
  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedLeads);
      await axios.delete(apiUrl("/api/leads/bulk"), {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids }
      });
      setSuccess(`${ids.length} lead(s) deleted.`);
      clearSelection();
      setBulkConfirm(null);
      await fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Bulk delete failed");
      setBulkConfirm(null);
    }
  };

  const handleDeletePage = async () => {
    try {
      const ids = activeLeads.map(l => l._id);
      await axios.delete(apiUrl("/api/leads/bulk"), {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids }
      });
      setSuccess(`${ids.length} lead(s) on this page deleted.`);
      clearSelection();
      setBulkConfirm(null);
      await fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Delete page failed");
      setBulkConfirm(null);
    }
  };

  const handleDeleteAllFiltered = async () => {
    try {
      const params = Object.fromEntries(searchParams.entries());
      // Remove pagination params — we want to delete ALL matching
      delete params.page;
      delete params.limit;

      // Check if no filters applied → need confirmDeleteAll flag
      const hasFilters = Object.keys(params).length > 0;
      if (!hasFilters) params.confirmDeleteAll = "true";

      await axios.delete(apiUrl("/api/leads/all"), {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setSuccess(`All matching leads deleted.`);
      clearSelection();
      setBulkConfirm(null);
      await fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Delete all failed");
      setBulkConfirm(null);
    }
  };

  // ─── Confirmation dialog helper ──────────────────────────────────
  const openConfirm = (type) => {
    const activeFilters = Object.fromEntries(searchParams.entries());
    delete activeFilters.page; delete activeFilters.limit;
    const hasFilters = Object.keys(activeFilters).length > 0;

    if (type === "selected") {
      setBulkConfirm({ type, count: selectedLeads.size, hasFilters });
    } else if (type === "page") {
      setBulkConfirm({ type, count: activeLeads.length, hasFilters });
    } else if (type === "allFiltered") {
      setBulkConfirm({ type, count: pagination.totalLeads, hasFilters });
    }
  };

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open modal for adding new lead
  const handleAddLead = () => {
    setEditingLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "In Progress",
      notes: "",
      assignedTo: ""
    });
    setShowModal(true);
  };

  // Open modal for editing lead
  const handleEditLead = (lead) => {
    setEditingLead(lead._id);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      company: lead.company || "",
      status: lead.status || "In Progress",
      notes: lead.notes || "",
      assignedTo: lead.assignedTo?._id || ""
    });
    setShowModal(true);
  };

  // Submit form (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Validate
    // Note: Name and email are no longer strictly required
    // But we might still want at least one field to not create completely empty rows if needed

    try {
      if (editingLead) {
        // Update lead
        const response = await axios.put(
          apiUrl(`/api/leads/${editingLead}`),
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setLeads(leads.map(lead => lead._id === editingLead ? response.data : lead));
        setSuccess("Lead updated successfully!");
      } else {
        // Create lead
        const response = await axios.post(
          apiUrl("/api/leads"),
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setLeads([response.data, ...leads]);
        setSuccess("Lead created successfully!");
      }
      setShowModal(false);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving lead:", err);
      setError(err.response?.data?.message || "Failed to save lead");
    }
  };

  // Delete lead (Admin only)
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/leads/${leadId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(leads.filter(lead => lead._id !== leadId));
      setSuccess("Lead deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting lead:", err);
      setError(err.response?.data?.message || "Failed to delete lead");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = ["Name", "Email", "Phone", "Company", "Status", "Assigned To", "Notes"];
    const rows = leads.map(lead => [
      lead.name,
      lead.email,
      lead.phone || "",
      lead.company || "",
      lead.status,
      lead.assignedTo?.name || "",
      lead.notes || ""
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `leads_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV processing
  const processImportData = async (dataToImport, mapping) => {
    try {
      setImporting(true);
      setImportProgress(0);
      setShowMappingModal(false);

      const total = dataToImport.length;
      if (total === 0) {
        setError("No valid data found to import.");
        setImporting(false);
        return;
      }

      for (let i = 0; i < total; i++) {
        const row = dataToImport[i];
        await axios.post(apiUrl("/api/leads"), {
          name: mapping.name ? row[mapping.name] : "",
          email: mapping.email ? row[mapping.email] : "",
          phone: mapping.phone ? row[mapping.phone] : "",
          company: mapping.company ? row[mapping.company] : "",
          status: row["Status"] || row["status"] || "In Progress",
          assignedTo: "",
          notes: row["Notes"] || row["notes"] || ""
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setSuccess(`Imported ${total} leads successfully!`);
      await fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error importing CSV:", err);
      setError(err.response?.data?.message || "Failed to import CSV");
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const processExtractedText = (text) => {
    // Basic CSV or Tabular parsing
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) {
      setError("Unstructured data detected or too few rows. Please ensure your file contains tabular data.");
      return;
    }

    // Determine delimiter (comma or tab)
    const firstLine = lines[0];
    let delimiter = ",";
    if (firstLine.includes("\t")) {
      delimiter = "\t";
    } else if (!firstLine.includes(",")) {
      setError("Unstructured data detected. Please ensure your file contains tabular data separated by commas or tabs.");
      return;
    }

    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    setCsvHeaders(headers);

    const parsedData = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || "";
      });
      return obj;
    });
    setCsvData(parsedData);

    const lowercaseHeaders = headers.map(h => h.toLowerCase());
    const hasName = lowercaseHeaders.includes('name');
    const hasEmail = lowercaseHeaders.includes('email');
    const hasPhone = lowercaseHeaders.includes('phone');
    const hasCompany = lowercaseHeaders.includes('company');

    if (hasName && hasEmail && hasPhone && hasCompany) {
      processImportData(parsedData, {
        name: headers[lowercaseHeaders.indexOf('name')],
        email: headers[lowercaseHeaders.indexOf('email')],
        phone: headers[lowercaseHeaders.indexOf('phone')],
        company: headers[lowercaseHeaders.indexOf('company')]
      });
    } else {
      setColumnMapping({
        name: lowercaseHeaders.includes('name') ? headers[lowercaseHeaders.indexOf('name')] : "",
        email: lowercaseHeaders.includes('email') ? headers[lowercaseHeaders.indexOf('email')] : "",
        phone: lowercaseHeaders.includes('phone') ? headers[lowercaseHeaders.indexOf('phone')] : "",
        company: lowercaseHeaders.includes('company') ? headers[lowercaseHeaders.indexOf('company')] : ""
      });
      setShowMappingModal(true);
    }
  };

  // Import File (CSV, TXT, DOCX, PDF)
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    try {
      if (fileType === 'csv' || fileType === 'txt') {
        const reader = new FileReader();
        reader.onload = (event) => {
          processExtractedText(event.target.result);
        };
        reader.readAsText(file);
      } else if (fileType === 'docx') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          processExtractedText(result.value);
        };
        reader.readAsArrayBuffer(file);
      } else if (fileType === 'pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Reconstruct text block
            let lastY = -1;
            let text = "";
            for (const item of textContent.items) {
              if (lastY !== item.transform[5] && lastY !== -1) {
                text += "\n";
              } else if (lastY !== -1) {
                text += "\t"; // Separator between items on same line
              }
              text += item.str;
              lastY = item.transform[5];
            }
            fullText += text + "\n";
          }
          processExtractedText(fullText);
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError("Unsupported file format.");
      }
    } catch (err) {
      console.error("Parse Error:", err);
      setError("Error parsing the file.");
    }

    e.target.value = null; // Reset input
  };

  // Helper for skeleton rows
  const renderSkeletons = () => {
    return [...Array(pagination.limit || 10)].map((_, i) => (
      <tr key={`skel-${i}`} className="skeleton-row">
        {[...Array(10)].map((_, j) => (
          <td key={j}><div className="skeleton-box"></div></td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="leads-container">
      <h2 className="leads-heading"><FaClipboardList /> Leads Management</h2>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="leads-actions">
        <div className="csv-buttons">
          <button className="btn-csv" onClick={handleExportCSV}>📤 Export CSV</button>
          <input
            type="file"
            accept=".csv, .txt, .pdf, .docx, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain"
            onChange={handleImportCSV}
            style={{ display: "none" }}
            id="import-csv-input"
          />
          <label htmlFor="import-csv-input" className="btn-csv">📥 Import File</label>
        </div>
        
        {/* Mobile Toggle Button */}
        <button 
          className="btn-filter-toggle" 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <FaFilter /> {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Professional Filter Bar */}
      <div className={`leads-filters ${showMobileFilters ? "show-mobile" : ""}`}>
        <div className="filter-group search-group">
          <label>Search</label>
          <input
            className="filter-input"
            type="text"
            placeholder="Name, email, phone, or company..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            className="filter-input"
            value={searchParams.get("status") || ""}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label>From Date</label>
          <input
            className="filter-input"
            type="date"
            value={searchParams.get("startDate") || ""}
            onChange={(e) => updateFilter("startDate", e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            className="filter-input"
            type="date"
            value={searchParams.get("endDate") || ""}
            onChange={(e) => updateFilter("endDate", e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <div className="date-box">
            <select
              className="filter-input"
              value={searchParams.get("order") || "desc"}
              onChange={(e) => updateFilter("order", e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="filter-group">
          <label>Show</label>
          <select
            className="filter-input"
            value={searchParams.get("limit") || "10"}
            onChange={(e) => updateFilter("limit", e.target.value)}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Reset</label>
          <button className="btn-reset" onClick={handleClearFilters}>
            🔄 Clear
          </button>
        </div>
      </div>

      {/* Import Progress Overlay */}
      {importing && (
        <div className="import-overlay">
          <div className="import-progress-container">
            <h3>Processing Import...</h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${importProgress}%` }}></div>
            </div>
            <p className="progress-text">{importProgress}% Complete</p>
          </div>
        </div>
      )}

      {/* Actions + Bulk Action Bar */}
      <div className="leads-actions">
        <button className="btn-primary" onClick={handleAddLead}>
          ➕ Add New Lead
        </button>
        <div className="results-summary">
          Found <strong>{pagination.totalLeads}</strong> total leads
        </div>
        {userRole === "admin" && !loading && leads.length > 0 && (
          <div className="bulk-action-bar">
            <button className="btn-delete-page" onClick={() => openConfirm("page")}>
              🗑 Delete This Page ({activeLeads.length})
            </button>
            <button className="btn-delete-all" onClick={() => openConfirm("allFiltered")}>
              ⚠️ Delete All ({pagination.totalLeads})
            </button>
          </div>
        )}
      </div>

      {/* Floating selection bar appears when rows are checked */}
      {userRole === "admin" && selectedLeads.size > 0 && (
        <div className="selection-bar">
          <span className="selection-count">
            ✅ <strong>{selectedLeads.size}</strong> of {pagination.totalLeads} selected
          </span>
          <div className="selection-actions">
            <button className="btn-clear-select" onClick={clearSelection}>Deselect All</button>
            <button className="btn-delete-selected" onClick={() => openConfirm("selected")}>
              🗑 Delete Selected ({selectedLeads.size})
            </button>
          </div>
        </div>
      )}

      {/* Status Legend */}
      <div className="lead-status">
        <div className="status-item closed">🔥 Closed</div>
        <div className="status-item in-progress">🌤 In Progress</div>
        <div className="status-item not-interested">❄️ Not Interested</div>
      </div>

      {/* Leads Table Section */}
      <div className="leads-table">
        {leads.length > 0 || loading ? (
          <>
            <table>
              <thead>
                <tr>
                  {userRole === "admin" && (
                    <th className="col-checkbox">
                      <input
                        type="checkbox"
                        className="lead-checkbox"
                        checked={isAllPageSelected}
                        onChange={toggleSelectAll}
                        title="Select all on this page"
                      />
                    </th>
                  )}
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : (
                  activeLeads.map((lead, index) => (
                    <tr key={lead._id} className={selectedLeads.has(lead._id) ? "row-selected" : ""}>
                      {userRole === "admin" && (
                        <td className="col-checkbox">
                          <input
                            type="checkbox"
                            className="lead-checkbox"
                            checked={selectedLeads.has(lead._id)}
                            onChange={() => toggleSelectLead(lead._id)}
                          />
                        </td>
                      )}
                      <td data-label="#"> {(pagination.currentPage - 1) * pagination.limit + index + 1} </td>

                      <td data-label="Name" className="lead-name">
                        {lead.name || "-"}
                      </td>

                      <td data-label="Email" className="lead-email">
                        {lead.email || "-"}
                      </td>

                      <td data-label="Phone">
                        {lead.phone || "-"}
                      </td>

                      <td data-label="Company">
                        {lead.company || "-"}
                      </td>

                      <td data-label="Status">
                        <span className={`badge ${lead.status.toLowerCase().replace(" ", "-")}`}>
                          {lead.status}
                        </span>
                      </td>

                      <td data-label="Assigned To">
                        {lead.assignedTo?.name || "-"}
                      </td>

                      <td data-label="Created By">
                        {lead.createdBy?.name || "Unknown"}
                      </td>

                      <td data-label="Created At">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>

                      <td data-label="Actions" className="actions-cell">
                        <button
                          className="btn-edit"
                          onClick={() => handleEditLead(lead)}
                        >
                          ✏️ Edit
                        </button>

                        {userRole === "admin" && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteLead(lead._id)}
                          >
                            🗑 Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!loading && activeLeads.length === 0 && (
              <div className="empty-state">
                <h3>No leads found 😢</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            )}
          </>
        ) : (
          <div className="no-leads">
            <p>No leads found 😢</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing <strong>{leads.length}</strong> of <strong>{pagination.totalLeads}</strong> leads
            (Page {pagination.currentPage} of {pagination.totalPages})
          </div>

          <div className="pagination-controls">
            <button
              className="btn-page"
              disabled={pagination.currentPage <= 1}
              onClick={() => updateFilter("page", (pagination.currentPage - 1).toString())}
            >
              Previous
            </button>

            {[...Array(pagination.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Only show nearby pages if there are many
              if (
                pagination.totalPages > 7 &&
                pageNum !== 1 &&
                pageNum !== pagination.totalPages &&
                Math.abs(pageNum - pagination.currentPage) > 2
              ) {
                if (Math.abs(pageNum - pagination.currentPage) === 3) return <span key={pageNum}>...</span>;
                return null;
              }

              return (
                <button
                  key={pageNum}
                  className={`btn-page ${pagination.currentPage === pageNum ? "active" : ""}`}
                  onClick={() => updateFilter("page", pageNum.toString())}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="btn-page"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => updateFilter("page", (pagination.currentPage + 1).toString())}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkConfirm && (
        <div className="modal-overlay">
          <div className="modal-content danger-modal">
            <div className="modal-header">
              <h3>⚠️ Confirm Deletion</h3>
              <button className="close-btn" onClick={() => setBulkConfirm(null)}>✕</button>
            </div>
            <div className="danger-body">
              {bulkConfirm.type === "selected" && (
                <>
                  <p>You are about to permanently delete <strong>{bulkConfirm.count}</strong> selected lead(s).</p>
                  <p className="danger-warning">This action cannot be undone.</p>
                  <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setBulkConfirm(null)}>Cancel</button>
                    <button className="btn-danger-confirm" onClick={handleBulkDelete}>
                      Delete {bulkConfirm.count} Leads
                    </button>
                  </div>
                </>
              )}
              {bulkConfirm.type === "page" && (
                <>
                  <p>You are about to permanently delete all <strong>{bulkConfirm.count}</strong> leads on this page.</p>
                  <p className="danger-warning">This action cannot be undone.</p>
                  <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setBulkConfirm(null)}>Cancel</button>
                    <button className="btn-danger-confirm" onClick={handleDeletePage}>
                      Delete {bulkConfirm.count} Leads
                    </button>
                  </div>
                </>
              )}
              {bulkConfirm.type === "allFiltered" && (
                <>
                  <p>You are about to permanently delete <strong>{bulkConfirm.count}</strong> leads
                    {bulkConfirm.hasFilters
                      ? <> matching <strong>the current filters</strong>.</>
                      : <> — that's <strong>EVERY lead in the system</strong>!</>
                    }
                  </p>
                  {!bulkConfirm.hasFilters && (
                    <p className="danger-critical">🚨 NO FILTERS ARE ACTIVE. This will wipe all your data.</p>
                  )}
                  <p className="danger-warning">This action cannot be undone.</p>
                  <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setBulkConfirm(null)}>Cancel, Keep Leads</button>
                    <button className="btn-danger-confirm" onClick={handleDeleteAllFiltered}>
                      Yes, Delete All {bulkConfirm.count} Leads
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingLead ? "Edit Lead" : "Add New Lead"}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmitForm} className="lead-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter lead name"

                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email"

                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleFormChange}
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    {LEAD_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {userRole === "admin" && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Assign To</label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleFormChange}
                    >
                      <option value="">-- Unassigned --</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Add any notes about this lead"
                  rows="3"
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingLead ? "Update Lead" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CSV Mapping Modal */}
      {showMappingModal && (
        <div className="modal-overlay">
          <div className="modal-content mapping-modal">
            <div className="modal-header">
              <h3>Map CSV Columns</h3>
              <button className="close-btn" onClick={() => setShowMappingModal(false)}>✕</button>
            </div>
            <div className="mapping-form" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Please select which column from your CSV corresponds to each field.
              </p>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Name</label>
                <select
                  value={columnMapping.name}
                  onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Skip/None --</option>
                  {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Email</label>
                <select
                  value={columnMapping.email}
                  onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Skip/None --</option>
                  {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Phone</label>
                <select
                  value={columnMapping.phone}
                  onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Select Column --</option>
                  {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Company</label>
                <select
                  value={columnMapping.company}
                  onChange={(e) => setColumnMapping({ ...columnMapping, company: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Select Column --</option>
                  {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowMappingModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => processImportData(csvData, columnMapping)}
                >
                  Import Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leads;
