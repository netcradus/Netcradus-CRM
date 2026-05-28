import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";

import { apiUrl } from "../../config/api";

const STATUS_OPTIONS = [
  { value: "not_interested", label: "Not Interested" },
  { value: "call_back", label: "Call Back" },
  { value: "meeting_aligned", label: "Meeting Aligned" },
];

const MEETING_TYPE_OPTIONS = [
  { value: "in_person", label: "In Person" },
  { value: "video_call", label: "Video Call" },
  { value: "phone_call", label: "Phone Call" },
];

const CSV_IMPORT_FIELDS = [
  { value: "name", label: "Full Name", required: true },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "status", label: "Status" },
  { value: "note", label: "Note" },
  { value: "meetingScheduledAt", label: "Meeting Date & Time" },
  { value: "meetingLocation", label: "Meeting Location" },
  { value: "meetingType", label: "Meeting Type" },
];

const CALL_OUTCOME_OPTIONS = [
  { value: "no_answer", label: "No Answer" },
  { value: "call_back", label: "Call Back" },
  { value: "not_interested", label: "Not Interested" },
  { value: "meeting_aligned", label: "Meeting Aligned" },
  { value: "other", label: "Other" },
];

const emptyLeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "call_back",
  note: "",
  meetingScheduledAt: "",
  meetingLocation: "",
  meetingType: "",
};

const emptySalesStatusForm = {
  status: "call_back",
  meetingScheduledAt: "",
  meetingLocation: "",
  meetingType: "",
};

const emptySalesCallForm = {
  outcome: "call_back",
  note: "",
  meetingScheduledAt: "",
  meetingLocation: "",
  meetingType: "",
};

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const normalizeCsvHeader = (value) => String(value || "").trim().toLowerCase();
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const getStatusLabel = (status) => STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "--";
const getMeetingTypeLabel = (meetingType) => MEETING_TYPE_OPTIONS.find((option) => option.value === meetingType)?.label || meetingType || "--";
const getLastNote = (lead) => (Array.isArray(lead.notes) && lead.notes.length ? lead.notes[lead.notes.length - 1] : null);
const getLastCall = (lead) => (Array.isArray(lead.callLog) && lead.callLog.length ? lead.callLog[lead.callLog.length - 1] : null);

const sortNotesNewestFirst = (notes) =>
  [...(Array.isArray(notes) ? notes : [])].sort((left, right) => new Date(right.addedAt || 0) - new Date(left.addedAt || 0));

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString();
};

const toInputDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const readCsvHeaders = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || "");
      const headerLine = content.split(/\r?\n/).find((line) => line.trim());
      resolve(headerLine ? parseCsvLine(headerLine) : []);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const buildDefaultCsvMapping = (headers) => {
  const normalizedHeaders = headers.map(normalizeCsvHeader);
  return CSV_IMPORT_FIELDS.reduce((mapping, field) => {
    const exactIndex = normalizedHeaders.indexOf(normalizeCsvHeader(field.value));
    mapping[field.value] = exactIndex >= 0 ? headers[exactIndex] : "";
    return mapping;
  }, {});
};

function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ totalLeads: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [salesStatusForm, setSalesStatusForm] = useState(emptySalesStatusForm);
  const [salesNote, setSalesNote] = useState("");
  const [salesCallForm, setSalesCallForm] = useState(emptySalesCallForm);
  const [importMappingModal, setImportMappingModal] = useState(null);
  const [deleteFilterModal, setDeleteFilterModal] = useState(null);
  const fileInputRef = useRef(null);

  const userRole = normalizeRole(localStorage.getItem("userRole"));
  const isSuperUser = userRole === "super_user";
  const isSales = userRole === "sales";

  const updateFilter = (key, value) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") {
        next.set("page", "1");
      }
      return next;
    });
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(apiUrl("/api/leads"), {
        ...getAuthConfig(),
        params: Object.fromEntries(searchParams.entries()),
      });

      setLeads(Array.isArray(response.data?.data) ? response.data.data : []);
      setPagination(response.data?.pagination || { totalLeads: 0, totalPages: 1, currentPage: 1, limit: 10 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to fetch leads.");
    } finally {
      setLoading(false);
    }
  };

  const loadLeadDetail = async (leadId) => {
    if (!leadId) {
      setSelectedLead(null);
      return;
    }

    try {
      setPanelLoading(true);
      const response = await axios.get(apiUrl(`/api/leads/${leadId}`), getAuthConfig());
      const nextLead = response.data?.data;
      setSelectedLead(nextLead || null);
      setSalesStatusForm({
        status: nextLead?.status || "call_back",
        meetingScheduledAt: toInputDateTime(nextLead?.meetingScheduledAt),
        meetingLocation: nextLead?.meetingLocation || "",
        meetingType: nextLead?.meetingType || "",
      });
      setSalesCallForm({
        outcome: "call_back",
        note: "",
        meetingScheduledAt: toInputDateTime(nextLead?.meetingScheduledAt),
        meetingLocation: nextLead?.meetingLocation || "",
        meetingType: nextLead?.meetingType || "",
      });
      setSalesNote("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load lead details.");
    } finally {
      setPanelLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchParams]);

  useEffect(() => {
    if (selectedLeadId) {
      loadLeadDetail(selectedLeadId);
    }
  }, [selectedLeadId]);

  const openSuperUserModal = (lead) => {
    setEditingLeadId(lead?._id || null);
    setLeadForm({
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      company: lead?.company || "",
      status: lead?.status || "call_back",
      note: "",
      meetingScheduledAt: toInputDateTime(lead?.meetingScheduledAt),
      meetingLocation: lead?.meetingLocation || "",
      meetingType: lead?.meetingType || "",
    });
    setShowModal(true);
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...leadForm,
      meetingScheduledAt: leadForm.meetingScheduledAt || null,
    };

    try {
      setError("");
      setSuccess("");

      if (editingLeadId) {
        await axios.put(apiUrl(`/api/leads/${editingLeadId}`), payload, getAuthConfig());
        setSuccess("Lead updated successfully.");
      } else {
        await axios.post(apiUrl("/api/leads"), payload, getAuthConfig());
        setSuccess("Lead created successfully.");
      }

      setShowModal(false);
      setLeadForm(emptyLeadForm);
      setEditingLeadId(null);
      await fetchLeads();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || "Failed to save lead.");
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Delete lead?")) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/leads/${leadId}`), getAuthConfig());
      setSuccess("Lead deleted successfully.");
      await fetchLeads();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete lead.");
    }
  };

  const openDeleteFilteredModal = () => {
    const filters = Object.fromEntries(searchParams.entries());
    const activeFilters = ["status", "search", "startDate", "endDate"].filter((key) => filters[key]);
    const filterSummary = activeFilters.length
      ? activeFilters.map((key) => `${key}: ${filters[key]}`).join(", ")
      : "no filters";

    setDeleteFilterModal({ filters, activeFilters, filterSummary });
  };

  const handleDeleteFilteredLeads = async () => {
    if (!deleteFilterModal) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const response = await axios.delete(apiUrl("/api/leads/all"), {
        ...getAuthConfig(),
        params: {
          ...deleteFilterModal.filters,
          confirmDeleteAll: deleteFilterModal.activeFilters.length ? undefined : "true",
        },
      });
      setSuccess(response.data?.message || "Filtered leads deleted successfully.");
      setDeleteFilterModal(null);
      setSelectedLeadId(null);
      setSelectedLead(null);
      await fetchLeads();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete filtered leads.");
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(apiUrl("/api/leads/export"), {
        ...getAuthConfig(),
        params: Object.fromEntries(searchParams.entries()),
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "leads_export.csv";
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to export leads.");
    }
  };

  const uploadLeadFile = async (file, fieldMapping = null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (fieldMapping) {
      formData.append("fieldMapping", JSON.stringify(fieldMapping));
    }

    await axios.post(apiUrl("/api/leads/import"), formData, {
      ...getAuthConfig(),
      headers: {
        ...getAuthConfig().headers,
        "Content-Type": "multipart/form-data",
      },
    });
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const headers = await readCsvHeaders(file);
      const defaultMapping = buildDefaultCsvMapping(headers);
      const recognizedHeaders = Object.values(defaultMapping).filter(Boolean).length;
      const shouldAskForMapping = !defaultMapping.name || recognizedHeaders < Math.min(headers.length, 2);

      if (shouldAskForMapping) {
        setImportMappingModal({ file, headers, mapping: defaultMapping });
        return;
      }

      await uploadLeadFile(file);

      setSuccess("Leads imported successfully.");
      await fetchLeads();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to import leads.");
    } finally {
      event.target.value = "";
    }
  };

  const handleMappedImport = async () => {
    if (!importMappingModal?.file) {
      return;
    }

    if (!importMappingModal.mapping.name) {
      setError("Please map the Full Name field before importing.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await uploadLeadFile(importMappingModal.file, importMappingModal.mapping);
      setImportMappingModal(null);
      setSuccess("Leads imported successfully.");
      await fetchLeads();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to import leads.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const submitSalesUpdate = async (payload, successMessage) => {
    if (!selectedLeadId) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axios.patch(apiUrl(`/api/leads/${selectedLeadId}/sales-update`), payload, getAuthConfig());
      setSuccess(successMessage);
      await Promise.all([fetchLeads(), loadLeadDetail(selectedLeadId)]);

      if (payload.status === "meeting_aligned" || payload.callLog?.outcome === "meeting_aligned") {
        setSelectedLeadId(null);
        setSelectedLead(null);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || "Failed to update lead.");
    }
  };

  const handleSalesStatusSave = async () => {
    await submitSalesUpdate(
      {
        status: salesStatusForm.status,
        meetingScheduledAt: salesStatusForm.meetingScheduledAt || null,
        meetingLocation: salesStatusForm.meetingLocation,
        meetingType: salesStatusForm.meetingType,
      },
      salesStatusForm.status === "meeting_aligned" ? "Meeting aligned successfully." : "Status updated successfully."
    );
  };

  const handleSalesNoteSave = async () => {
    if (!salesNote.trim()) {
      return;
    }

    await submitSalesUpdate({ note: salesNote.trim() }, "Note added successfully.");
    setSalesNote("");
  };

  const handleSalesCallSave = async () => {
    await submitSalesUpdate(
      {
        status: salesCallForm.outcome === "meeting_aligned"
          ? "meeting_aligned"
          : salesCallForm.outcome === "call_back"
            ? "call_back"
            : salesCallForm.outcome === "not_interested"
              ? "not_interested"
              : undefined,
        meetingScheduledAt: salesCallForm.meetingScheduledAt || null,
        meetingLocation: salesCallForm.meetingLocation,
        meetingType: salesCallForm.meetingType,
        callLog: {
          outcome: salesCallForm.outcome,
          note: salesCallForm.note,
        },
      },
      "Call logged successfully."
    );

    setSalesCallForm({
      outcome: "call_back",
      note: "",
      meetingScheduledAt: salesStatusForm.meetingScheduledAt,
      meetingLocation: salesStatusForm.meetingLocation,
      meetingType: salesStatusForm.meetingType,
    });
  };

  const salesLeadRows = useMemo(() => leads, [leads]);

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)", position: "relative" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Leads</h1>
          <p className="subtitle">{isSales ? "Call, update, and qualify open leads." : "Track and manage every lead before it reaches a meeting."}</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-3)" }}>
          {isSuperUser ? (
            <>
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
              <button className="btn btn-ghost" onClick={handleExport}>
                <Download size={16} /> Export
              </button>
              <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} /> Import
              </button>
              <button className="btn btn-primary" onClick={() => openSuperUserModal(null)}>
                <Plus size={16} /> New Lead
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-error)" }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-success)" }}>
          {success}
        </div>
      ) : null}

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-field" style={{ flex: 1, minWidth: "240px", marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                className="form-input"
                style={{ paddingLeft: "36px" }}
                placeholder="Name, email, company..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    updateFilter("search", searchInput);
                  }
                }}
              />
            </div>
          </div>
          <div className="form-field" style={{ width: "180px", marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={searchParams.get("status") || ""} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ width: "170px", marginBottom: 0 }}>
            <label className="form-label">Date From</label>
            <input className="form-input" type="date" value={searchParams.get("startDate") || ""} onChange={(event) => updateFilter("startDate", event.target.value)} />
          </div>
          <div className="form-field" style={{ width: "170px", marginBottom: 0 }}>
            <label className="form-label">Date To</label>
            <input className="form-input" type="date" value={searchParams.get("endDate") || ""} onChange={(event) => updateFilter("endDate", event.target.value)} />
          </div>
          <div className="form-field" style={{ width: "170px", marginBottom: 0 }}>
            <label className="form-label">Sort By</label>
            <select className="form-select" value={searchParams.get("sortBy") || "createdAt"} onChange={(event) => updateFilter("sortBy", event.target.value)}>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="name">Name</option>
              <option value="company">Company</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="form-field" style={{ width: "140px", marginBottom: 0 }}>
            <label className="form-label">Order</label>
            <select className="form-select" value={searchParams.get("order") || "desc"} onChange={(event) => updateFilter("order", event.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div className="form-field" style={{ width: "120px", marginBottom: 0 }}>
            <label className="form-label">Limit</label>
            <select className="form-select" value={searchParams.get("limit") || "10"} onChange={(event) => updateFilter("limit", event.target.value)}>
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => { setSearchInput(""); setSearchParams({}); }}>Clear</button>
          {isSuperUser ? (
            <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={openDeleteFilteredModal}>
              <Trash2 size={16} /> Delete by Filters
            </button>
          ) : null}
        </div>
      </div>

      {isSuperUser ? (
        <div className="nc-card">
          <table className="nc-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Company</th>
                <th>Email / Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Note</th>
                <th>Last Call</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading leads...</td>
                </tr>
              ) : leads.length ? (
                leads.map((lead) => (
                  <tr key={lead._id}>
                    <td style={{ fontWeight: "var(--font-semibold)" }}>{lead.name}</td>
                    <td>{lead.company || "--"}</td>
                    <td>
                      <div style={{ fontSize: "var(--text-xs)" }}>
                        <div>{lead.email || "--"}</div>
                        <div style={{ color: "var(--color-text-muted)" }}>{lead.phone || "--"}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${lead.status === "not_interested" ? "error" : lead.status === "meeting_aligned" ? "success" : "warning"}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(lead.createdAt)}</td>
                    <td>{getLastNote(lead)?.text || "--"}</td>
                    <td>{formatDateTime(getLastCall(lead)?.calledAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button className="btn btn-ghost" onClick={() => openSuperUserModal(lead)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => handleDeleteLead(lead._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No leads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="nc-card">
          <table className="nc-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Note</th>
                <th>Last Call</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading leads...</td>
                </tr>
              ) : salesLeadRows.length ? (
                salesLeadRows.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <div style={{ fontWeight: "var(--font-semibold)" }}>{lead.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{lead.company || "--"}</div>
                    </td>
                    <td>{lead.phone || "--"}</td>
                    <td>
                      <span className={`badge badge-${lead.status === "not_interested" ? "error" : "warning"}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(lead.createdAt)}</td>
                    <td>{getLastNote(lead)?.text ? `${getLastNote(lead).text.slice(0, 50)}${getLastNote(lead).text.length > 50 ? "..." : ""}` : "--"}</td>
                    <td>{formatDateTime(getLastCall(lead)?.calledAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button className="btn btn-ghost" onClick={() => setSelectedLeadId(lead._id)}>Log Call</button>
                        <button className="btn btn-primary" onClick={() => setSelectedLeadId(lead._id)}>View Details</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No leads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)", padding: "0 var(--space-2)" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Showing {leads.length} of {pagination.totalLeads} leads
        </span>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button className="btn btn-ghost" disabled={pagination.currentPage <= 1} onClick={() => updateFilter("page", String(pagination.currentPage - 1))}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button className="btn btn-ghost" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => updateFilter("page", String(pagination.currentPage + 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showModal ? (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "560px" }}>
            <div className="nc-modal-header">
              <h3>{editingLeadId ? "Edit Lead" : "Add New Lead"}</h3>
            </div>

            <form onSubmit={handleLeadSubmit} className="form">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" required value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Company</label>
                  <input className="form-input" value={leadForm.company} onChange={(event) => setLeadForm({ ...leadForm, company: event.target.value })} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={leadForm.status} onChange={(event) => setLeadForm({ ...leadForm, status: event.target.value })}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {leadForm.status === "meeting_aligned" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <div className="form-field">
                    <label className="form-label">Meeting Date & Time</label>
                    <input className="form-input" type="datetime-local" required value={leadForm.meetingScheduledAt} onChange={(event) => setLeadForm({ ...leadForm, meetingScheduledAt: event.target.value })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Meeting Type</label>
                    <select className="form-select" required value={leadForm.meetingType} onChange={(event) => setLeadForm({ ...leadForm, meetingType: event.target.value })}>
                      <option value="">Select type</option>
                      {MEETING_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Meeting Location</label>
                    <input className="form-input" required value={leadForm.meetingLocation} onChange={(event) => setLeadForm({ ...leadForm, meetingLocation: event.target.value })} />
                  </div>
                </div>
              ) : null}
              <div className="form-field">
                <label className="form-label">Add Note</label>
                <textarea className="form-input" rows={3} value={leadForm.note} onChange={(event) => setLeadForm({ ...leadForm, note: event.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {leadForm.status === "meeting_aligned" ? "Align Meeting & Save" : "Save Lead"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {importMappingModal ? (
        <div className="nc-modal-overlay" onClick={() => setImportMappingModal(null)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "640px" }}>
            <div className="nc-modal-header">
              <h3>Map CSV Fields</h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
              Some CSV headers do not match lead fields. Select where each CSV column should be imported.
            </p>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {CSV_IMPORT_FIELDS.map((field) => (
                <div key={field.value} className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">{field.label}{field.required ? " *" : ""}</label>
                  <select
                    className="form-select"
                    value={importMappingModal.mapping[field.value] || ""}
                    onChange={(event) => setImportMappingModal((previous) => ({
                      ...previous,
                      mapping: {
                        ...previous.mapping,
                        [field.value]: event.target.value,
                      },
                    }))}
                  >
                    <option value="">Do not import</option>
                    {importMappingModal.headers.map((header) => (
                      <option key={`${field.value}-${header}`} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleMappedImport}>Import Leads</button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setImportMappingModal(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteFilterModal ? (
        <div className="nc-modal-overlay" onClick={() => setDeleteFilterModal(null)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "520px" }}>
            <div className="nc-modal-header">
              <h3>Delete Filtered Leads</h3>
            </div>
            <div className="nc-modal-body">
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
                This will delete all leads matching the current filters.
              </p>
              <div className="nc-card" style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                  Current filters
                </div>
                <div style={{ fontWeight: "var(--font-semibold)" }}>{deleteFilterModal.filterSummary}</div>
              </div>
              <p style={{ color: "var(--color-error)", marginBottom: "var(--space-5)" }}>
                This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteFilterModal(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleDeleteFilteredLeads}>
                  Delete Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSales && selectedLeadId ? (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.35)",
              zIndex: 30,
            }}
            onClick={() => {
              setSelectedLeadId(null);
              setSelectedLead(null);
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "min(40vw, 520px)",
              minWidth: "360px",
              height: "100vh",
              background: "var(--color-surface, #fff)",
              zIndex: 31,
              boxShadow: "-16px 0 40px rgba(15, 23, 42, 0.16)",
              overflowY: "auto",
              padding: "var(--space-6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
              <div>
                <h2 style={{ marginBottom: "var(--space-1)" }}>{selectedLead?.name || "Lead Details"}</h2>
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>{selectedLead?.company || "No company"}</p>
              </div>
              <button className="btn btn-ghost" onClick={() => { setSelectedLeadId(null); setSelectedLead(null); }}>
                <X size={16} />
              </button>
            </div>

            {panelLoading ? (
              <div className="nc-card">Loading lead details...</div>
            ) : selectedLead ? (
              <>
                <div className="nc-card" style={{ marginBottom: "var(--space-4)" }}>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <div><strong>Phone:</strong> {selectedLead.phone || "--"}</div>
                    <div><strong>Email:</strong> {selectedLead.email || "--"}</div>
                    <div><strong>Company:</strong> {selectedLead.company || "--"}</div>
                    <div><strong>Status:</strong> {getStatusLabel(selectedLead.status)}</div>
                  </div>
                </div>

                <div className="nc-card" style={{ marginBottom: "var(--space-4)" }}>
                  <h3 style={{ marginBottom: "var(--space-3)" }}>Change Status</h3>
                  <div className="form-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={salesStatusForm.status} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, status: event.target.value })}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  {salesStatusForm.status === "meeting_aligned" ? (
                    <>
                      <div className="form-field">
                        <label className="form-label">Meeting Date & Time</label>
                        <input className="form-input" type="datetime-local" value={salesStatusForm.meetingScheduledAt} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, meetingScheduledAt: event.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Meeting Location</label>
                        <input className="form-input" value={salesStatusForm.meetingLocation} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, meetingLocation: event.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Meeting Type</label>
                        <select className="form-select" value={salesStatusForm.meetingType} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, meetingType: event.target.value })}>
                          <option value="">Select type</option>
                          {MEETING_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : null}
                  <button className="btn btn-primary" onClick={handleSalesStatusSave}>
                    {salesStatusForm.status === "meeting_aligned" ? "Align Meeting & Save" : "Save Status"}
                  </button>
                </div>

                <div className="nc-card" style={{ marginBottom: "var(--space-4)" }}>
                  <h3 style={{ marginBottom: "var(--space-3)" }}>Notes</h3>
                  <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                    {sortNotesNewestFirst(selectedLead.notes).map((note) => (
                      <div key={note._id || `${note.addedAt}-${note.text}`} style={{ paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                          {note.addedBy?.name || "Unknown"} · {formatDateTime(note.addedAt)}
                        </div>
                        <div>{note.text}</div>
                      </div>
                    ))}
                    {!selectedLead.notes?.length ? <div style={{ color: "var(--color-text-muted)" }}>No notes yet.</div> : null}
                  </div>
                  <textarea className="form-input" rows={3} placeholder="Add a new note" value={salesNote} onChange={(event) => setSalesNote(event.target.value)} />
                  <button className="btn btn-primary" style={{ marginTop: "var(--space-3)" }} onClick={handleSalesNoteSave}>Save Note</button>
                </div>

                <div className="nc-card">
                  <h3 style={{ marginBottom: "var(--space-3)" }}>Call Log</h3>
                  <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                    {(selectedLead.callLog || []).map((call) => (
                      <div key={call._id || `${call.calledAt}-${call.outcome}`} style={{ paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                          {formatDateTime(call.calledAt)} · {getStatusLabel(call.outcome)}
                        </div>
                        <div>{call.note || "--"}</div>
                      </div>
                    ))}
                    {!selectedLead.callLog?.length ? <div style={{ color: "var(--color-text-muted)" }}>No calls logged yet.</div> : null}
                  </div>
                  <div className="form-field">
                    <label className="form-label">Outcome</label>
                    <select className="form-select" value={salesCallForm.outcome} onChange={(event) => setSalesCallForm({ ...salesCallForm, outcome: event.target.value })}>
                      {CALL_OUTCOME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  {salesCallForm.outcome === "meeting_aligned" ? (
                    <>
                      <div className="form-field">
                        <label className="form-label">Meeting Date & Time</label>
                        <input className="form-input" type="datetime-local" value={salesCallForm.meetingScheduledAt} onChange={(event) => setSalesCallForm({ ...salesCallForm, meetingScheduledAt: event.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Meeting Location</label>
                        <input className="form-input" value={salesCallForm.meetingLocation} onChange={(event) => setSalesCallForm({ ...salesCallForm, meetingLocation: event.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Meeting Type</label>
                        <select className="form-select" value={salesCallForm.meetingType} onChange={(event) => setSalesCallForm({ ...salesCallForm, meetingType: event.target.value })}>
                          <option value="">Select type</option>
                          {MEETING_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : null}
                  <textarea className="form-input" rows={3} maxLength={500} placeholder="Add a short note" value={salesCallForm.note} onChange={(event) => setSalesCallForm({ ...salesCallForm, note: event.target.value })} />
                  <button className="btn btn-primary" style={{ marginTop: "var(--space-3)" }} onClick={handleSalesCallSave}>Log Call</button>
                </div>
              </>
            ) : null}
          </aside>
        </>
      ) : null}
    </div>
  );
}

export default Leads;
