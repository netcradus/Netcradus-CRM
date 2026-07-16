// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import axios from "axios";
// import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";

// import { apiUrl } from "../../config/api";

// const STATUS_OPTIONS = [
//   { value: "not_interested", label: "Not Interested" },
//   { value: "call_back", label: "Call Back" },
//   { value: "meeting_aligned", label: "Meeting Aligned" },
// ];

// const MEETING_TYPE_OPTIONS = [
//   { value: "in_person", label: "In Person" },
//   { value: "video_call", label: "Video Call" },
//   { value: "phone_call", label: "Phone Call" },
// ];

// const CSV_IMPORT_FIELDS = [
//   { value: "name", label: "Full Name", required: true },
//   { value: "email", label: "Email" },
//   { value: "phone", label: "Phone" },
//   { value: "company", label: "Company" },
//   { value: "status", label: "Status" },
//   { value: "note", label: "Note" },
//   { value: "meetingScheduledAt", label: "Meeting Date & Time" },
//   { value: "meetingLocation", label: "Meeting Location" },
//   { value: "meetingType", label: "Meeting Type" },
// ];

// const CALL_OUTCOME_OPTIONS = [
//   { value: "no_answer", label: "No Answer" },
//   { value: "call_back", label: "Call Back" },
//   { value: "not_interested", label: "Not Interested" },
//   { value: "meeting_aligned", label: "Meeting Aligned" },
//   { value: "other", label: "Other" },
// ];

// const emptyLeadForm = {
//   name: "",
//   email: "",
//   phone: "",
//   company: "",
//   status: "call_back",
//   note: "",
//   meetingScheduledAt: "",
//   meetingLocation: "",
//   meetingType: "",
// };

// const emptySalesStatusForm = {
//   status: "call_back",
//   meetingScheduledAt: "",
//   meetingLocation: "",
//   meetingType: "",
// };

// const emptySalesCallForm = {
//   outcome: "call_back",
//   note: "",
//   meetingScheduledAt: "",
//   meetingLocation: "",
//   meetingType: "",
// };

// const normalizeRole = (role) => String(role || "").trim().toLowerCase();
// const normalizeCsvHeader = (value) => String(value || "").trim().toLowerCase();
// const getAuthConfig = () => ({
//   headers: {
//     Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//   },
// });

// const getStatusLabel = (status) => STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "--";
// const getMeetingTypeLabel = (meetingType) => MEETING_TYPE_OPTIONS.find((option) => option.value === meetingType)?.label || meetingType || "--";
// const getLastNote = (lead) => (Array.isArray(lead.notes) && lead.notes.length ? lead.notes[lead.notes.length - 1] : null);
// const getLastCall = (lead) => (Array.isArray(lead.callLog) && lead.callLog.length ? lead.callLog[lead.callLog.length - 1] : null);

// const sortNotesNewestFirst = (notes) =>
//   [...(Array.isArray(notes) ? notes : [])].sort((left, right) => new Date(right.addedAt || 0) - new Date(left.addedAt || 0));

// const formatDateTime = (value) => {
//   if (!value) {
//     return "--";
//   }

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) {
//     return "--";
//   }

//   return date.toLocaleString();
// };

// const toInputDateTime = (value) => {
//   if (!value) {
//     return "";
//   }

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) {
//     return "";
//   }

//   const year = date.getFullYear();
//   const month = `${date.getMonth() + 1}`.padStart(2, "0");
//   const day = `${date.getDate()}`.padStart(2, "0");
//   const hours = `${date.getHours()}`.padStart(2, "0");
//   const minutes = `${date.getMinutes()}`.padStart(2, "0");
//   return `${year}-${month}-${day}T${hours}:${minutes}`;
// };

// const parseCsvLine = (line) => {
//   const values = [];
//   let current = "";
//   let inQuotes = false;

//   for (let index = 0; index < line.length; index += 1) {
//     const character = line[index];

//     if (character === '"') {
//       if (inQuotes && line[index + 1] === '"') {
//         current += '"';
//         index += 1;
//       } else {
//         inQuotes = !inQuotes;
//       }
//       continue;
//     }

//     if (character === "," && !inQuotes) {
//       values.push(current);
//       current = "";
//       continue;
//     }

//     current += character;
//   }

//   values.push(current);
//   return values.map((value) => value.trim());
// };

// const readCsvHeaders = (file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       const content = String(reader.result || "");
//       const headerLine = content.split(/\r?\n/).find((line) => line.trim());
//       resolve(headerLine ? parseCsvLine(headerLine) : []);
//     };
//     reader.onerror = () => reject(reader.error);
//     reader.readAsText(file);
//   });

// const buildDefaultCsvMapping = (headers) => {
//   const normalizedHeaders = headers.map(normalizeCsvHeader);
//   return CSV_IMPORT_FIELDS.reduce((mapping, field) => {
//     const exactIndex = normalizedHeaders.indexOf(normalizeCsvHeader(field.value));
//     mapping[field.value] = exactIndex >= 0 ? headers[exactIndex] : "";
//     return mapping;
//   }, {});
// };

// function Leads() {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [leads, setLeads] = useState([]);
//   const [pagination, setPagination] = useState({ totalLeads: 0, totalPages: 1, currentPage: 1, limit: 10 });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [editingLeadId, setEditingLeadId] = useState(null);
//   const [leadForm, setLeadForm] = useState(emptyLeadForm);
//   const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
//   const [selectedLeadId, setSelectedLeadId] = useState(null);
//   const [selectedLead, setSelectedLead] = useState(null);
//   const [panelLoading, setPanelLoading] = useState(false);
//   const [salesStatusForm, setSalesStatusForm] = useState(emptySalesStatusForm);
//   const [salesNote, setSalesNote] = useState("");
//   const [salesCallForm, setSalesCallForm] = useState(emptySalesCallForm);
//   const [importMappingModal, setImportMappingModal] = useState(null);
//   const [deleteFilterModal, setDeleteFilterModal] = useState(null);
//   const fileInputRef = useRef(null);

//   const userRole = normalizeRole(localStorage.getItem("userRole"));
//   const isSuperUser = userRole === "super_user";
//   const isSales = userRole === "sales";

//   const updateFilter = (key, value) => {
//     setSearchParams((previous) => {
//       const next = new URLSearchParams(previous);
//       if (value) {
//         next.set(key, value);
//       } else {
//         next.delete(key);
//       }
//       if (key !== "page") {
//         next.set("page", "1");
//       }
//       return next;
//     });
//   };

//   const fetchLeads = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const response = await axios.get(apiUrl("/api/leads"), {
//         ...getAuthConfig(),
//         params: Object.fromEntries(searchParams.entries()),
//       });

//       setLeads(Array.isArray(response.data?.data) ? response.data.data : []);
//       setPagination(response.data?.pagination || { totalLeads: 0, totalPages: 1, currentPage: 1, limit: 10 });
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || "Failed to fetch leads.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadLeadDetail = async (leadId) => {
//     if (!leadId) {
//       setSelectedLead(null);
//       return;
//     }

//     try {
//       setPanelLoading(true);
//       const response = await axios.get(apiUrl(`/api/leads/${leadId}`), getAuthConfig());
//       const nextLead = response.data?.data;
//       setSelectedLead(nextLead || null);
//       setSalesStatusForm({
//         status: nextLead?.status || "call_back",
//         meetingScheduledAt: toInputDateTime(nextLead?.meetingScheduledAt),
//         meetingLocation: nextLead?.meetingLocation || "",
//         meetingType: nextLead?.meetingType || "",
//       });
//       setSalesCallForm({
//         outcome: "call_back",
//         note: "",
//         meetingScheduledAt: toInputDateTime(nextLead?.meetingScheduledAt),
//         meetingLocation: nextLead?.meetingLocation || "",
//         meetingType: nextLead?.meetingType || "",
//       });
//       setSalesNote("");
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || "Failed to load lead details.");
//     } finally {
//       setPanelLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLeads();
//   }, [searchParams]);

//   useEffect(() => {
//     if (selectedLeadId) {
//       loadLeadDetail(selectedLeadId);
//     }
//   }, [selectedLeadId]);

//   const openSuperUserModal = (lead) => {
//     setEditingLeadId(lead?._id || null);
//     setLeadForm({
//       name: lead?.name || "",
//       email: lead?.email || "",
//       phone: lead?.phone || "",
//       company: lead?.company || "",
//       status: lead?.status || "call_back",
//       note: "",
//       meetingScheduledAt: toInputDateTime(lead?.meetingScheduledAt),
//       meetingLocation: lead?.meetingLocation || "",
//       meetingType: lead?.meetingType || "",
//     });
//     setShowModal(true);
//   };

//   const handleLeadSubmit = async (event) => {
//     event.preventDefault();

//     const payload = {
//       ...leadForm,
//       meetingScheduledAt: leadForm.meetingScheduledAt || null,
//     };

//     try {
//       setError("");
//       setSuccess("");

//       if (editingLeadId) {
//         await axios.put(apiUrl(`/api/leads/${editingLeadId}`), payload, getAuthConfig());
//         setSuccess("Lead updated successfully.");
//       } else {
//         await axios.post(apiUrl("/api/leads"), payload, getAuthConfig());
//         setSuccess("Lead created successfully.");
//       }

//       setShowModal(false);
//       setLeadForm(emptyLeadForm);
//       setEditingLeadId(null);
//       await fetchLeads();
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || requestError.response?.data?.error || "Failed to save lead.");
//     }
//   };

//   const handleDeleteLead = async (leadId) => {
//     if (!window.confirm("Delete lead?")) {
//       return;
//     }

//     try {
//       await axios.delete(apiUrl(`/api/leads/${leadId}`), getAuthConfig());
//       setSuccess("Lead deleted successfully.");
//       await fetchLeads();
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || "Failed to delete lead.");
//     }
//   };

//   const openDeleteFilteredModal = () => {
//     const filters = Object.fromEntries(searchParams.entries());
//     const activeFilters = ["status", "search", "startDate", "endDate"].filter((key) => filters[key]);
//     const filterSummary = activeFilters.length
//       ? activeFilters.map((key) => `${key}: ${filters[key]}`).join(", ")
//       : "no filters";

//     setDeleteFilterModal({ filters, activeFilters, filterSummary });
//   };

//   const handleDeleteFilteredLeads = async () => {
//     if (!deleteFilterModal) {
//       return;
//     }

//     try {
//       setError("");
//       setSuccess("");
//       const response = await axios.delete(apiUrl("/api/leads/all"), {
//         ...getAuthConfig(),
//         params: {
//           ...deleteFilterModal.filters,
//           confirmDeleteAll: deleteFilterModal.activeFilters.length ? undefined : "true",
//         },
//       });
//       setSuccess(response.data?.message || "Filtered leads deleted successfully.");
//       setDeleteFilterModal(null);
//       setSelectedLeadId(null);
//       setSelectedLead(null);
//       await fetchLeads();
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || "Failed to delete filtered leads.");
//     }
//   };

//   const handleExport = async () => {
//     try {
//       const response = await axios.get(apiUrl("/api/leads/export"), {
//         ...getAuthConfig(),
//         params: Object.fromEntries(searchParams.entries()),
//         responseType: "blob",
//       });

//       const blob = new Blob([response.data], { type: "text/csv" });
//       const url = window.URL.createObjectURL(blob);
//       const anchor = document.createElement("a");
//       anchor.href = url;
//       anchor.download = "leads_export.csv";
//       anchor.click();
//       window.URL.revokeObjectURL(url);
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || "Failed to export leads.");
//     }
//   };

//   const uploadLeadFile = async (file, fieldMapping = null) => {
//     const formData = new FormData();
//     formData.append("file", file);
//     if (fieldMapping) {
//       formData.append("fieldMapping", JSON.stringify(fieldMapping));
//     }

//     await axios.post(apiUrl("/api/leads/import"), formData, {
//       ...getAuthConfig(),
//       headers: {
//         ...getAuthConfig().headers,
//         "Content-Type": "multipart/form-data",
//       },
//     });
//   };

//   const handleImport = async (event) => {
//     const file = event.target.files?.[0];
//     if (!file) {
//       return;
//     }

//     try {
//       setError("");
//       setSuccess("");
//       const headers = await readCsvHeaders(file);
//       const defaultMapping = buildDefaultCsvMapping(headers);
//       const recognizedHeaders = Object.values(defaultMapping).filter(Boolean).length;
//       const shouldAskForMapping = !defaultMapping.name || recognizedHeaders < Math.min(headers.length, 2);

//       if (shouldAskForMapping) {
//         setImportMappingModal({ file, headers, mapping: defaultMapping });
//         return;
//       }

//       await uploadLeadFile(file);

//       setSuccess("Leads imported successfully.");
//       await fetchLeads();
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || "Failed to import leads.");
//     } finally {
//       event.target.value = "";
//     }
//   };

//   const handleMappedImport = async () => {
//     if (!importMappingModal?.file) {
//       return;
//     }

//     if (!importMappingModal.mapping.name) {
//       setError("Please map the Full Name field before importing.");
//       return;
//     }

//     try {
//       setError("");
//       setSuccess("");
//       await uploadLeadFile(importMappingModal.file, importMappingModal.mapping);
//       setImportMappingModal(null);
//       setSuccess("Leads imported successfully.");
//       await fetchLeads();
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || "Failed to import leads.");
//     } finally {
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     }
//   };

//   const submitSalesUpdate = async (payload, successMessage) => {
//     if (!selectedLeadId) {
//       return;
//     }

//     try {
//       setError("");
//       setSuccess("");
//       await axios.patch(apiUrl(`/api/leads/${selectedLeadId}/sales-update`), payload, getAuthConfig());
//       setSuccess(successMessage);
//       await Promise.all([fetchLeads(), loadLeadDetail(selectedLeadId)]);

//       if (payload.status === "meeting_aligned" || payload.callLog?.outcome === "meeting_aligned") {
//         setSelectedLeadId(null);
//         setSelectedLead(null);
//       }
//     } catch (requestError) {
//       setError(requestError.response?.data?.message || requestError.response?.data?.error || "Failed to update lead.");
//     }
//   };

//   const handleSalesStatusSave = async () => {
//     await submitSalesUpdate(
//       {
//         status: salesStatusForm.status,
//         meetingScheduledAt: salesStatusForm.meetingScheduledAt || null,
//         meetingLocation: salesStatusForm.meetingLocation,
//         meetingType: salesStatusForm.meetingType,
//       },
//       salesStatusForm.status === "meeting_aligned" ? "Meeting aligned successfully." : "Status updated successfully."
//     );
//   };

//   const handleSalesNoteSave = async () => {
//     if (!salesNote.trim()) {
//       return;
//     }

//     await submitSalesUpdate({ note: salesNote.trim() }, "Note added successfully.");
//     setSalesNote("");
//   };

//   const handleSalesCallSave = async () => {
//     await submitSalesUpdate(
//       {
//         status: salesCallForm.outcome === "meeting_aligned"
//           ? "meeting_aligned"
//           : salesCallForm.outcome === "call_back"
//             ? "call_back"
//             : salesCallForm.outcome === "not_interested"
//               ? "not_interested"
//               : undefined,
//         meetingScheduledAt: salesCallForm.meetingScheduledAt || null,
//         meetingLocation: salesCallForm.meetingLocation,
//         meetingType: salesCallForm.meetingType,
//         callLog: {
//           outcome: salesCallForm.outcome,
//           note: salesCallForm.note,
//         },
//       },
//       "Call logged successfully."
//     );

//     setSalesCallForm({
//       outcome: "call_back",
//       note: "",
//       meetingScheduledAt: salesStatusForm.meetingScheduledAt,
//       meetingLocation: salesStatusForm.meetingLocation,
//       meetingType: salesStatusForm.meetingType,
//     });
//   };

//   const salesLeadRows = useMemo(() => leads, [leads]);

//   return (
//     <div className="dashboard-container" style={{ padding: "var(--space-6)", position: "relative" }}>
//       <div className="page-header">
//         <div className="page-header-left">
//           <h1 className="title">Leads</h1>
//           <p className="subtitle">{isSales ? "Call, update, and qualify open leads." : "Track and manage every lead before it reaches a meeting."}</p>
//         </div>
//         <div className="page-header-right" style={{ display: "flex", gap: "var(--space-3)" }}>
//           {isSuperUser ? (
//             <>
//               <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
//               <button className="btn btn-ghost" onClick={handleExport}>
//                 <Download size={16} /> Export
//               </button>
//               <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
//                 <Upload size={16} /> Import
//               </button>
//               <button className="btn btn-primary" onClick={() => openSuperUserModal(null)}>
//                 <Plus size={16} /> New Lead
//               </button>
//             </>
//           ) : null}
//         </div>
//       </div>

//       {error ? (
//         <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-error)" }}>
//           {error}
//         </div>
//       ) : null}
//       {success ? (
//         <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-success)" }}>
//           {success}
//         </div>
//       ) : null}

//       <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
//         <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
//           <div className="form-field" style={{ flex: 1, minWidth: "240px", marginBottom: 0 }}>
//             <label className="form-label">Search</label>
//             <div style={{ position: "relative" }}>
//               <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
//               <input
//                 className="form-input"
//                 style={{ paddingLeft: "36px" }}
//                 placeholder="Name, email, company..."
//                 value={searchInput}
//                 onChange={(event) => setSearchInput(event.target.value)}
//                 onKeyDown={(event) => {
//                   if (event.key === "Enter") {
//                     updateFilter("search", searchInput);
//                   }
//                 }}
//               />
//             </div>
//           </div>
//           <div className="form-field" style={{ width: "180px", marginBottom: 0 }}>
//             <label className="form-label">Status</label>
//             <select className="form-select" value={searchParams.get("status") || ""} onChange={(event) => updateFilter("status", event.target.value)}>
//               <option value="">All Status</option>
//               {STATUS_OPTIONS.map((option) => (
//                 <option key={option.value} value={option.value}>{option.label}</option>
//               ))}
//             </select>
//           </div>
//           <div className="form-field" style={{ width: "170px", marginBottom: 0 }}>
//             <label className="form-label">Date From</label>
//             <input className="form-input" type="date" value={searchParams.get("startDate") || ""} onChange={(event) => updateFilter("startDate", event.target.value)} />
//           </div>
//           <div className="form-field" style={{ width: "170px", marginBottom: 0 }}>
//             <label className="form-label">Date To</label>
//             <input className="form-input" type="date" value={searchParams.get("endDate") || ""} onChange={(event) => updateFilter("endDate", event.target.value)} />
//           </div>
//           <div className="form-field" style={{ width: "170px", marginBottom: 0 }}>
//             <label className="form-label">Sort By</label>
//             <select className="form-select" value={searchParams.get("sortBy") || "createdAt"} onChange={(event) => updateFilter("sortBy", event.target.value)}>
//               <option value="createdAt">Created Date</option>
//               <option value="updatedAt">Updated Date</option>
//               <option value="name">Name</option>
//               <option value="company">Company</option>
//               <option value="status">Status</option>
//             </select>
//           </div>
//           <div className="form-field" style={{ width: "140px", marginBottom: 0 }}>
//             <label className="form-label">Order</label>
//             <select className="form-select" value={searchParams.get("order") || "desc"} onChange={(event) => updateFilter("order", event.target.value)}>
//               <option value="desc">Newest First</option>
//               <option value="asc">Oldest First</option>
//             </select>
//           </div>
//           <div className="form-field" style={{ width: "120px", marginBottom: 0 }}>
//             <label className="form-label">Limit</label>
//             <select className="form-select" value={searchParams.get("limit") || "10"} onChange={(event) => updateFilter("limit", event.target.value)}>
//               <option value="10">10 / page</option>
//               <option value="25">25 / page</option>
//               <option value="50">50 / page</option>
//             </select>
//           </div>
//           <button className="btn btn-ghost" onClick={() => { setSearchInput(""); setSearchParams({}); }}>Clear</button>
//           {isSuperUser ? (
//             <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={openDeleteFilteredModal}>
//               <Trash2 size={16} /> Delete by Filters
//             </button>
//           ) : null}
//         </div>
//       </div>

//       {isSuperUser ? (
//         <div className="nc-card">
//           <table className="nc-table">
//             <thead>
//               <tr>
//                 <th>Lead Name</th>
//                 <th>Company</th>
//                 <th>Email / Phone</th>
//                 <th>Status</th>
//                 <th>Created</th>
//                 <th>Last Note</th>
//                 <th>Last Call</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="8" style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading leads...</td>
//                 </tr>
//               ) : leads.length ? (
//                 leads.map((lead) => (
//                   <tr key={lead._id}>
//                     <td style={{ fontWeight: "var(--font-semibold)" }}>{lead.name}</td>
//                     <td>{lead.company || "--"}</td>
//                     <td>
//                       <div style={{ fontSize: "var(--text-xs)" }}>
//                         <div>{lead.email || "--"}</div>
//                         <div style={{ color: "var(--color-text-muted)" }}>{lead.phone || "--"}</div>
//                       </div>
//                     </td>
//                     <td>
//                       <span className={`badge badge-${lead.status === "not_interested" ? "error" : lead.status === "meeting_aligned" ? "success" : "warning"}`}>
//                         {getStatusLabel(lead.status)}
//                       </span>
//                     </td>
//                     <td>{formatDateTime(lead.createdAt)}</td>
//                     <td>{getLastNote(lead)?.text || "--"}</td>
//                     <td>{formatDateTime(getLastCall(lead)?.calledAt)}</td>
//                     <td>
//                       <div style={{ display: "flex", gap: "var(--space-2)" }}>
//                         <button className="btn btn-ghost" onClick={() => openSuperUserModal(lead)}>
//                           <Pencil size={14} />
//                         </button>
//                         <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => handleDeleteLead(lead._id)}>
//                           <Trash2 size={14} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="8" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No leads found.</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <div className="nc-card">
//           <table className="nc-table">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Phone</th>
//                 <th>Status</th>
//                 <th>Created</th>
//                 <th>Last Note</th>
//                 <th>Last Call</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading leads...</td>
//                 </tr>
//               ) : salesLeadRows.length ? (
//                 salesLeadRows.map((lead) => (
//                   <tr key={lead._id}>
//                     <td>
//                       <div style={{ fontWeight: "var(--font-semibold)" }}>{lead.name}</div>
//                       <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{lead.company || "--"}</div>
//                     </td>
//                     <td>{lead.phone || "--"}</td>
//                     <td>
//                       <span className={`badge badge-${lead.status === "not_interested" ? "error" : "warning"}`}>
//                         {getStatusLabel(lead.status)}
//                       </span>
//                     </td>
//                     <td>{formatDateTime(lead.createdAt)}</td>
//                     <td>{getLastNote(lead)?.text ? `${getLastNote(lead).text.slice(0, 50)}${getLastNote(lead).text.length > 50 ? "..." : ""}` : "--"}</td>
//                     <td>{formatDateTime(getLastCall(lead)?.calledAt)}</td>
//                     <td>
//                       <div style={{ display: "flex", gap: "var(--space-2)" }}>
//                         <button className="btn btn-ghost" onClick={() => setSelectedLeadId(lead._id)}>Log Call</button>
//                         <button className="btn btn-primary" onClick={() => setSelectedLeadId(lead._id)}>View Details</button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No leads found.</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)", padding: "0 var(--space-2)" }}>
//         <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//           Showing {leads.length} of {pagination.totalLeads} leads
//         </span>
//         <div style={{ display: "flex", gap: "var(--space-2)" }}>
//           <button className="btn btn-ghost" disabled={pagination.currentPage <= 1} onClick={() => updateFilter("page", String(pagination.currentPage - 1))}>
//             <ChevronLeft size={16} />
//           </button>
//           <span style={{ display: "flex", alignItems: "center", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
//             Page {pagination.currentPage} of {pagination.totalPages}
//           </span>
//           <button className="btn btn-ghost" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => updateFilter("page", String(pagination.currentPage + 1))}>
//             <ChevronRight size={16} />
//           </button>
//         </div>
//       </div>

//       {showModal ? (
//         <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
//           <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "560px" }}>
//             <div className="nc-modal-header">
//               <h3>{editingLeadId ? "Edit Lead" : "Add New Lead"}</h3>
//             </div>

//             <form onSubmit={handleLeadSubmit} className="form">
//               <div className="form-field">
//                 <label className="form-label">Full Name</label>
//                 <input className="form-input" required value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} />
//               </div>
//               <div className="form-field">
//                 <label className="form-label">Email</label>
//                 <input className="form-input" type="email" value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} />
//               </div>
//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
//                 <div className="form-field">
//                   <label className="form-label">Phone</label>
//                   <input className="form-input" value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} />
//                 </div>
//                 <div className="form-field">
//                   <label className="form-label">Company</label>
//                   <input className="form-input" value={leadForm.company} onChange={(event) => setLeadForm({ ...leadForm, company: event.target.value })} />
//                 </div>
//               </div>
//               <div className="form-field">
//                 <label className="form-label">Status</label>
//                 <select className="form-select" value={leadForm.status} onChange={(event) => setLeadForm({ ...leadForm, status: event.target.value })}>
//                   {STATUS_OPTIONS.map((option) => (
//                     <option key={option.value} value={option.value}>{option.label}</option>
//                   ))}
//                 </select>
//               </div>
//               {leadForm.status === "meeting_aligned" ? (
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
//                   <div className="form-field">
//                     <label className="form-label">Meeting Date & Time</label>
//                     <input className="form-input" type="datetime-local" required value={leadForm.meetingScheduledAt} onChange={(event) => setLeadForm({ ...leadForm, meetingScheduledAt: event.target.value })} />
//                   </div>
//                   <div className="form-field">
//                     <label className="form-label">Meeting Type</label>
//                     <select className="form-select" required value={leadForm.meetingType} onChange={(event) => setLeadForm({ ...leadForm, meetingType: event.target.value })}>
//                       <option value="">Select type</option>
//                       {MEETING_TYPE_OPTIONS.map((option) => (
//                         <option key={option.value} value={option.value}>{option.label}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="form-field" style={{ gridColumn: "1 / -1" }}>
//                     <label className="form-label">Meeting Location</label>
//                     <input className="form-input" required value={leadForm.meetingLocation} onChange={(event) => setLeadForm({ ...leadForm, meetingLocation: event.target.value })} />
//                   </div>
//                 </div>
//               ) : null}
//               <div className="form-field">
//                 <label className="form-label">Add Note</label>
//                 <textarea className="form-input" rows={3} value={leadForm.note} onChange={(event) => setLeadForm({ ...leadForm, note: event.target.value })} />
//               </div>
//               <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
//                   {leadForm.status === "meeting_aligned" ? "Align Meeting & Save" : "Save Lead"}
//                 </button>
//                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       ) : null}

//       {importMappingModal ? (
//         <div className="nc-modal-overlay" onClick={() => setImportMappingModal(null)}>
//           <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "640px" }}>
//             <div className="nc-modal-header">
//               <h3>Map CSV Fields</h3>
//             </div>
//             <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
//               Some CSV headers do not match lead fields. Select where each CSV column should be imported.
//             </p>
//             <div style={{ display: "grid", gap: "var(--space-3)" }}>
//               {CSV_IMPORT_FIELDS.map((field) => (
//                 <div key={field.value} className="form-field" style={{ marginBottom: 0 }}>
//                   <label className="form-label">{field.label}{field.required ? " *" : ""}</label>
//                   <select
//                     className="form-select"
//                     value={importMappingModal.mapping[field.value] || ""}
//                     onChange={(event) => setImportMappingModal((previous) => ({
//                       ...previous,
//                       mapping: {
//                         ...previous.mapping,
//                         [field.value]: event.target.value,
//                       },
//                     }))}
//                   >
//                     <option value="">Do not import</option>
//                     {importMappingModal.headers.map((header) => (
//                       <option key={`${field.value}-${header}`} value={header}>{header}</option>
//                     ))}
//                   </select>
//                 </div>
//               ))}
//             </div>
//             <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
//               <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleMappedImport}>Import Leads</button>
//               <button
//                 type="button"
//                 className="btn btn-ghost"
//                 style={{ flex: 1 }}
//                 onClick={() => {
//                   setImportMappingModal(null);
//                   if (fileInputRef.current) {
//                     fileInputRef.current.value = "";
//                   }
//                 }}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {deleteFilterModal ? (
//         <div className="nc-modal-overlay" onClick={() => setDeleteFilterModal(null)}>
//           <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "520px" }}>
//             <div className="nc-modal-header">
//               <h3>Delete Filtered Leads</h3>
//             </div>
//             <div className="nc-modal-body">
//               <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
//                 This will delete all leads matching the current filters.
//               </p>
//               <div className="nc-card" style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)" }}>
//                 <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
//                   Current filters
//                 </div>
//                 <div style={{ fontWeight: "var(--font-semibold)" }}>{deleteFilterModal.filterSummary}</div>
//               </div>
//               <p style={{ color: "var(--color-error)", marginBottom: "var(--space-5)" }}>
//                 This action cannot be undone.
//               </p>
//               <div style={{ display: "flex", gap: "var(--space-3)" }}>
//                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteFilterModal(null)}>
//                   Cancel
//                 </button>
//                 <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleDeleteFilteredLeads}>
//                   Delete Leads
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {isSales && selectedLeadId ? (
//         <>
//           <div
//             style={{
//               position: "fixed",
//               inset: 0,
//               background: "rgba(15, 23, 42, 0.35)",
//               zIndex: 30,
//             }}
//             onClick={() => {
//               setSelectedLeadId(null);
//               setSelectedLead(null);
//             }}
//           />
//           <aside
//             style={{
//               position: "fixed",
//               top: 0,
//               right: 0,
//               width: "min(40vw, 520px)",
//               minWidth: "360px",
//               height: "100vh",
//               background: "var(--color-surface, #fff)",
//               zIndex: 31,
//               boxShadow: "-16px 0 40px rgba(15, 23, 42, 0.16)",
//               overflowY: "auto",
//               padding: "var(--space-6)",
//             }}
//           >
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
//               <div>
//                 <h2 style={{ marginBottom: "var(--space-1)" }}>{selectedLead?.name || "Lead Details"}</h2>
//                 <p style={{ color: "var(--color-text-muted)", margin: 0 }}>{selectedLead?.company || "No company"}</p>
//               </div>
//               <button className="btn btn-ghost" onClick={() => { setSelectedLeadId(null); setSelectedLead(null); }}>
//                 <X size={16} />
//               </button>
//             </div>

//             {panelLoading ? (
//               <div className="nc-card">Loading lead details...</div>
//             ) : selectedLead ? (
//               <>
//                 <div className="nc-card" style={{ marginBottom: "var(--space-4)" }}>
//                   <div style={{ display: "grid", gap: "var(--space-2)" }}>
//                     <div><strong>Phone:</strong> {selectedLead.phone || "--"}</div>
//                     <div><strong>Email:</strong> {selectedLead.email || "--"}</div>
//                     <div><strong>Company:</strong> {selectedLead.company || "--"}</div>
//                     <div><strong>Status:</strong> {getStatusLabel(selectedLead.status)}</div>
//                   </div>
//                 </div>

//                 <div className="nc-card" style={{ marginBottom: "var(--space-4)" }}>
//                   <h3 style={{ marginBottom: "var(--space-3)" }}>Change Status</h3>
//                   <div className="form-field">
//                     <label className="form-label">Status</label>
//                     <select className="form-select" value={salesStatusForm.status} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, status: event.target.value })}>
//                       {STATUS_OPTIONS.map((option) => (
//                         <option key={option.value} value={option.value}>{option.label}</option>
//                       ))}
//                     </select>
//                   </div>
//                   {salesStatusForm.status === "meeting_aligned" ? (
//                     <>
//                       <div className="form-field">
//                         <label className="form-label">Meeting Date & Time</label>
//                         <input className="form-input" type="datetime-local" value={salesStatusForm.meetingScheduledAt} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, meetingScheduledAt: event.target.value })} />
//                       </div>
//                       <div className="form-field">
//                         <label className="form-label">Meeting Location</label>
//                         <input className="form-input" value={salesStatusForm.meetingLocation} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, meetingLocation: event.target.value })} />
//                       </div>
//                       <div className="form-field">
//                         <label className="form-label">Meeting Type</label>
//                         <select className="form-select" value={salesStatusForm.meetingType} onChange={(event) => setSalesStatusForm({ ...salesStatusForm, meetingType: event.target.value })}>
//                           <option value="">Select type</option>
//                           {MEETING_TYPE_OPTIONS.map((option) => (
//                             <option key={option.value} value={option.value}>{option.label}</option>
//                           ))}
//                         </select>
//                       </div>
//                     </>
//                   ) : null}
//                   <button className="btn btn-primary" onClick={handleSalesStatusSave}>
//                     {salesStatusForm.status === "meeting_aligned" ? "Align Meeting & Save" : "Save Status"}
//                   </button>
//                 </div>

//                 <div className="nc-card" style={{ marginBottom: "var(--space-4)" }}>
//                   <h3 style={{ marginBottom: "var(--space-3)" }}>Notes</h3>
//                   <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
//                     {sortNotesNewestFirst(selectedLead.notes).map((note) => (
//                       <div key={note._id || `${note.addedAt}-${note.text}`} style={{ paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
//                         <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
//                           {note.addedBy?.name || "Unknown"} · {formatDateTime(note.addedAt)}
//                         </div>
//                         <div>{note.text}</div>
//                       </div>
//                     ))}
//                     {!selectedLead.notes?.length ? <div style={{ color: "var(--color-text-muted)" }}>No notes yet.</div> : null}
//                   </div>
//                   <textarea className="form-input" rows={3} placeholder="Add a new note" value={salesNote} onChange={(event) => setSalesNote(event.target.value)} />
//                   <button className="btn btn-primary" style={{ marginTop: "var(--space-3)" }} onClick={handleSalesNoteSave}>Save Note</button>
//                 </div>

//                 <div className="nc-card">
//                   <h3 style={{ marginBottom: "var(--space-3)" }}>Call Log</h3>
//                   <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
//                     {(selectedLead.callLog || []).map((call) => (
//                       <div key={call._id || `${call.calledAt}-${call.outcome}`} style={{ paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
//                         <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
//                           {formatDateTime(call.calledAt)} · {getStatusLabel(call.outcome)}
//                         </div>
//                         <div>{call.note || "--"}</div>
//                       </div>
//                     ))}
//                     {!selectedLead.callLog?.length ? <div style={{ color: "var(--color-text-muted)" }}>No calls logged yet.</div> : null}
//                   </div>
//                   <div className="form-field">
//                     <label className="form-label">Outcome</label>
//                     <select className="form-select" value={salesCallForm.outcome} onChange={(event) => setSalesCallForm({ ...salesCallForm, outcome: event.target.value })}>
//                       {CALL_OUTCOME_OPTIONS.map((option) => (
//                         <option key={option.value} value={option.value}>{option.label}</option>
//                       ))}
//                     </select>
//                   </div>
//                   {salesCallForm.outcome === "meeting_aligned" ? (
//                     <>
//                       <div className="form-field">
//                         <label className="form-label">Meeting Date & Time</label>
//                         <input className="form-input" type="datetime-local" value={salesCallForm.meetingScheduledAt} onChange={(event) => setSalesCallForm({ ...salesCallForm, meetingScheduledAt: event.target.value })} />
//                       </div>
//                       <div className="form-field">
//                         <label className="form-label">Meeting Location</label>
//                         <input className="form-input" value={salesCallForm.meetingLocation} onChange={(event) => setSalesCallForm({ ...salesCallForm, meetingLocation: event.target.value })} />
//                       </div>
//                       <div className="form-field">
//                         <label className="form-label">Meeting Type</label>
//                         <select className="form-select" value={salesCallForm.meetingType} onChange={(event) => setSalesCallForm({ ...salesCallForm, meetingType: event.target.value })}>
//                           <option value="">Select type</option>
//                           {MEETING_TYPE_OPTIONS.map((option) => (
//                             <option key={option.value} value={option.value}>{option.label}</option>
//                           ))}
//                         </select>
//                       </div>
//                     </>
//                   ) : null}
//                   <textarea className="form-input" rows={3} maxLength={500} placeholder="Add a short note" value={salesCallForm.note} onChange={(event) => setSalesCallForm({ ...salesCallForm, note: event.target.value })} />
//                   <button className="btn btn-primary" style={{ marginTop: "var(--space-3)" }} onClick={handleSalesCallSave}>Log Call</button>
//                 </div>
//               </>
//             ) : null}
//           </aside>
//         </>
//       ) : null}
//     </div>
//   );
// }

// export default Leads;





// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import axios from "axios";
// import {
//   ChevronLeft, ChevronRight, Download, Pencil, Plus,
//   Search, Trash2, Upload, X, User, Building2, Phone,
//   Mail, Lock, Send, Clock, Link2, Bell,
// } from "lucide-react";

// import { apiUrl } from "../../config/api";

// /* ─────────────────────────────────────────────────────────────
//    CONSTANTS
// ───────────────────────────────────────────────────────────── */
// const STATUS_OPTIONS = [
//   { value: "not_interested", label: "Not Interested" },
//   { value: "call_back", label: "Call Back" },
//   { value: "meeting_aligned", label: "Meeting Aligned" },
// ];

// const MEETING_TYPE_OPTIONS = [
//   { value: "in_person", label: "In Person" },
//   { value: "video_call", label: "Video Call" },
//   { value: "phone_call", label: "Phone Call" },
// ];

// const CSV_IMPORT_FIELDS = [
//   { value: "name", label: "Full Name", required: true },
//   { value: "email", label: "Email" },
//   { value: "phone", label: "Phone" },
//   { value: "company", label: "Company" },
//   { value: "status", label: "Status" },
//   { value: "note", label: "Note" },
//   { value: "meetingScheduledAt", label: "Meeting Date & Time" },
//   { value: "meetingLocation", label: "Meeting Location" },
//   { value: "meetingType", label: "Meeting Type" },
// ];

// const CALL_OUTCOME_OPTIONS = [
//   { value: "no_answer", label: "No Answer" },
//   { value: "call_back", label: "Call Back" },
//   { value: "not_interested", label: "Not Interested" },
//   { value: "meeting_aligned", label: "Meeting Aligned" },
//   { value: "other", label: "Other" },
// ];

// const DETAIL_TABS = ["Overview", "Notes", "Call Log"];

// const DEALS_API = apiUrl("/api/deals");

// const emptyDealForm = {
//   name: "", clientName: "", clientPhone: "", clientEmail: "",
//   companyName: "", businessUrl: "", description: "", value: "",
//   expectedCloseDate: "", initialComment: "", meetingLink: "",
//   meetingTime: "", meetingDiscussion: "", reminderDate: "", reminderNote: "",
// };

// const emptyLeadForm = {
//   name: "", email: "", phone: "", company: "",
//   status: "call_back", note: "",
//   meetingScheduledAt: "", meetingLocation: "", meetingType: "",
// };

// const emptySalesStatusForm = {
//   status: "call_back", meetingScheduledAt: "",
//   meetingLocation: "", meetingType: "",
// };

// const emptySalesCallForm = {
//   outcome: "call_back", note: "",
//   meetingScheduledAt: "", meetingLocation: "", meetingType: "",
// };

// /* ─────────────────────────────────────────────────────────────
//    HELPERS
// ───────────────────────────────────────────────────────────── */
// const normalizeRole = (r) => String(r || "").trim().toLowerCase();
// const normalizeCsvHeader = (v) => String(v || "").trim().toLowerCase();
// const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } });
// const getStatusLabel = (s) => STATUS_OPTIONS.find((o) => o.value === s)?.label || s || "--";
// const getMeetingTypeLabel = (t) => MEETING_TYPE_OPTIONS.find((o) => o.value === t)?.label || t || "--";
// const getLastNote = (lead) => Array.isArray(lead.notes) && lead.notes.length ? lead.notes[lead.notes.length - 1] : null;
// const getLastCall = (lead) => Array.isArray(lead.callLog) && lead.callLog.length ? lead.callLog[lead.callLog.length - 1] : null;
// const sortNotesNewest = (notes) => [...(Array.isArray(notes) ? notes : [])].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
// const isMeetingAligned = (lead) => lead?.status === "meeting_aligned";

// const formatDateTime = (v) => {
//   if (!v) return "--";
//   const d = new Date(v);
//   return isNaN(d.getTime()) ? "--" : d.toLocaleString();
// };

// const toInputDateTime = (v) => {
//   if (!v) return "";
//   const d = new Date(v);
//   if (isNaN(d.getTime())) return "";
//   const pad = (n) => String(n).padStart(2, "0");
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
// };

// const parseCsvLine = (line) => {
//   const values = []; let cur = ""; let inQ = false;
//   for (let i = 0; i < line.length; i++) {
//     const c = line[i];
//     if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } continue; }
//     if (c === ',' && !inQ) { values.push(cur); cur = ""; continue; }
//     cur += c;
//   }
//   values.push(cur);
//   return values.map((v) => v.trim());
// };

// const readCsvHeaders = (file) => new Promise((res, rej) => {
//   const r = new FileReader();
//   r.onload = () => {
//     const content = String(r.result || "");
//     const line = content.split(/\r?\n/).find((l) => l.trim());
//     res(line ? parseCsvLine(line) : []);
//   };
//   r.onerror = () => rej(r.error);
//   r.readAsText(file);
// });

// const buildDefaultCsvMapping = (headers) => {
//   const norm = headers.map(normalizeCsvHeader);
//   return CSV_IMPORT_FIELDS.reduce((map, field) => {
//     const idx = norm.indexOf(normalizeCsvHeader(field.value));
//     map[field.value] = idx >= 0 ? headers[idx] : "";
//     return map;
//   }, {});
// };

// /* ─────────────────────────────────────────────────────────────
//    SMALL SHARED COMPONENTS
// ───────────────────────────────────────────────────────────── */
// const Field = ({ label, value }) => (
//   <div style={{ marginBottom: "var(--space-3)" }}>
//     <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 2 }}>{label}</span>
//     <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{value || "—"}</span>
//   </div>
// );

// const SectionHeader = ({ icon: Icon, title }) => (
//   <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--space-3)" }}>
//     <Icon size={15} style={{ color: "var(--color-accent)" }} />
//     <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>{title}</h4>
//   </div>
// );

// const EmptyState = ({ text }) => (
//   <p style={{ margin: 0, padding: "12px 14px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", background: "var(--color-bg-muted)", borderRadius: 8 }}>{text}</p>
// );

// const ReadOnlyBanner = () => (
//   <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px", marginBottom: "var(--space-4)" }}>
//     <Lock size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
//     <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//       This lead is <strong>Meeting Aligned</strong>. Records are read-only — no new entries can be added.
//     </p>
//   </div>
// );

// const statusBadgeVariant = (s) => s === "not_interested" ? "error" : s === "meeting_aligned" ? "success" : "warning";

// /* ─────────────────────────────────────────────────────────────
//    TAB BAR
// ───────────────────────────────────────────────────────────── */
// const TabBar = ({ active, onChange, tabs }) => (
//   <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "var(--space-5)" }}>
//     {tabs.map((t) => (
//       <button key={t} onClick={() => onChange(t)} style={{
//         background: "none", border: "none", padding: "10px 16px",
//         fontSize: "var(--text-sm)", fontWeight: active === t ? 600 : 400,
//         color: active === t ? "var(--color-accent)" : "var(--color-text)",
//         borderBottom: active === t ? "2px solid var(--color-accent)" : "2px solid transparent",
//         cursor: "pointer", marginBottom: -1, transition: "color .15s",
//       }}>{t}</button>
//     ))}
//   </div>
// );

// /* ─────────────────────────────────────────────────────────────
//    MAIN COMPONENT
// ───────────────────────────────────────────────────────────── */
// function Leads() {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [deals, setDeals] = useState([]);
//   const [pagination, setPagination] = useState({ totalLeads: 0, totalPages: 1, currentPage: 1, limit: 10 });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // super-user add/edit modal
//   const [showModal, setShowModal] = useState(false);
//   const [editingLeadId, setEditingLeadId] = useState(null);
//   const [leadForm, setLeadForm] = useState(emptyLeadForm);

//   // search
//   const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

//   // detail modal (sales)
//   const [selectedLeadId, setSelectedLeadId] = useState(null);
//   const [selectedLead, setSelectedLead] = useState(null);
//   const [panelLoading, setPanelLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("Overview");

//   // sales forms
//   const [salesStatusForm, setSalesStatusForm] = useState(emptySalesStatusForm);
//   const [salesNote, setSalesNote] = useState("");
//   const [salesCallForm, setSalesCallForm] = useState(emptySalesCallForm);

//   // import / delete
//   const [importMappingModal, setImportMappingModal] = useState(null);
//   const [deleteFilterModal, setDeleteFilterModal] = useState(null);
//   const fileInputRef = useRef(null);

//   // Add Deal modal (sales team)
//   const [showDealModal, setShowDealModal] = useState(false);
//   const [dealForm, setDealForm] = useState(emptyDealForm);
//   const [dealSuccess, setDealSuccess] = useState("");

//   const userRole = normalizeRole(localStorage.getItem("userRole"));
//   const isSuperUser = userRole === "super_user";
//   const isSales = userRole === "sales";

//   /* ── URL filter helper ── */
//   const updateFilter = (key, value) => {
//     setSearchParams((prev) => {
//       const next = new URLSearchParams(prev);
//       value ? next.set(key, value) : next.delete(key);
//       if (key !== "page") next.set("page", "1");
//       return next;
//     });
//   };

//   /* ── Fetch list ── */
//   const fetchDeals = async () => {
//     try {
//       setLoading(true);

//       const res = await axios.get(
//         apiUrl("/api/deals"),
//         getAuthConfig()
//       );

//       setDeals(res.data?.data || []);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to load deals");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ── Load single lead ── */
//   const loadLeadDetail = async (id) => {
//     if (!id) { setSelectedLead(null); return; }
//     try {
//       setPanelLoading(true);
//       const res = await axios.get(apiUrl(`/api/leads/${id}`), getAuthConfig());
//       const lead = res.data?.data;
//       setSelectedLead(lead || null);
//       setSalesStatusForm({
//         status: lead?.status || "call_back",
//         meetingScheduledAt: toInputDateTime(lead?.meetingScheduledAt),
//         meetingLocation: lead?.meetingLocation || "",
//         meetingType: lead?.meetingType || "",
//       });
//       setSalesCallForm({
//         outcome: "call_back", note: "",
//         meetingScheduledAt: toInputDateTime(lead?.meetingScheduledAt),
//         meetingLocation: lead?.meetingLocation || "",
//         meetingType: lead?.meetingType || "",
//       });
//       setSalesNote("");
//     } catch (e) { setError(e.response?.data?.message || "Failed to load lead details."); }
//     finally { setPanelLoading(false); }
//   };

//   useEffect(() => {
//     fetchDeals();
//   }, []);
//   useEffect(() => { if (selectedLeadId) loadLeadDetail(selectedLeadId); }, [selectedLeadId]);

//   /* ── Open modal ── */
//   const openSuperUserModal = (lead) => {
//     setEditingLeadId(lead?._id || null);
//     setLeadForm(lead ? {
//       name: lead.name || "", email: lead.email || "", phone: lead.phone || "",
//       company: lead.company || "", status: lead.status || "call_back", note: "",
//       meetingScheduledAt: toInputDateTime(lead.meetingScheduledAt),
//       meetingLocation: lead.meetingLocation || "", meetingType: lead.meetingType || "",
//     } : emptyLeadForm);
//     setShowModal(true);
//   };

//   const openLeadDetail = (lead) => {
//     setSelectedLeadId(lead._id);
//     setActiveTab("Overview");
//   };

//   const closeDetail = () => { setSelectedLeadId(null); setSelectedLead(null); };

//   /* ── CRUD ── */
//   const handleLeadSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       setError(""); setSuccess("");
//       const payload = { ...leadForm, meetingScheduledAt: leadForm.meetingScheduledAt || null };
//       if (editingLeadId) {
//         await axios.put(apiUrl(`/api/leads/${editingLeadId}`), payload, getAuthConfig());
//         setSuccess("Lead updated successfully.");
//       } else {
//         await axios.post(apiUrl("/api/leads"), payload, getAuthConfig());
//         setSuccess("Lead created successfully.");
//       }
//       setShowModal(false); setLeadForm(emptyLeadForm); setEditingLeadId(null);
//       fetchDeals();
//     } catch (e) { setError(e.response?.data?.message || e.response?.data?.error || "Failed to save lead."); }
//   };

//   const handleDeleteLead = async (id) => {
//     if (!window.confirm("Delete lead?")) return;
//     try {
//       await axios.delete(apiUrl(`/api/leads/${id}`), getAuthConfig());
//       setSuccess("Lead deleted.");
//       fetchDeals();
//     } catch (e) { setError(e.response?.data?.message || "Failed to delete lead."); }
//   };

//   /* ── Export / Import ── */
//   const handleExport = async () => {
//     try {
//       const res = await axios.get(apiUrl("/api/leads/export"), { ...getAuthConfig(), params: Object.fromEntries(searchParams.entries()), responseType: "blob" });
//       const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
//       const a = document.createElement("a"); a.href = url; a.download = "leads_export.csv"; a.click();
//       window.URL.revokeObjectURL(url);
//     } catch (e) { setError(e.response?.data?.message || "Failed to export."); }
//   };

//   const uploadLeadFile = async (file, fieldMapping = null) => {
//     const fd = new FormData();
//     fd.append("file", file);
//     if (fieldMapping) fd.append("fieldMapping", JSON.stringify(fieldMapping));
//     await axios.post(apiUrl("/api/leads/import"), fd, { ...getAuthConfig(), headers: { ...getAuthConfig().headers, "Content-Type": "multipart/form-data" } });
//   };

//   const handleImport = async (e) => {
//     const file = e.target.files?.[0]; if (!file) return;
//     try {
//       setError(""); setSuccess("");
//       const headers = await readCsvHeaders(file);
//       const mapping = buildDefaultCsvMapping(headers);
//       const recognized = Object.values(mapping).filter(Boolean).length;
//       if (!mapping.name || recognized < Math.min(headers.length, 2)) {
//         setImportMappingModal({ file, headers, mapping }); return;
//       }
//       await uploadLeadFile(file);
//       setSuccess("Leads imported successfully.");
//       fetchDeals();
//     } catch (e) { setError(e.response?.data?.message || "Failed to import."); }
//     finally { e.target.value = ""; }
//   };

//   const handleMappedImport = async () => {
//     if (!importMappingModal?.file) return;
//     if (!importMappingModal.mapping.name) { setError("Please map the Full Name field."); return; }
//     try {
//       setError(""); setSuccess("");
//       await uploadLeadFile(importMappingModal.file, importMappingModal.mapping);
//       setImportMappingModal(null); setSuccess("Leads imported successfully.");
//       fetchDeals();
//     } catch (e) { setError(e.response?.data?.message || "Failed to import."); }
//     finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
//   };

//   const openDeleteFilteredModal = () => {
//     const filters = Object.fromEntries(searchParams.entries());
//     const active = ["status", "search", "startDate", "endDate"].filter((k) => filters[k]);
//     setDeleteFilterModal({ filters, activeFilters: active, filterSummary: active.length ? active.map((k) => `${k}: ${filters[k]}`).join(", ") : "no filters" });
//   };

//   const handleDeleteFilteredLeads = async () => {
//     if (!deleteFilterModal) return;
//     try {
//       setError(""); setSuccess("");
//       const res = await axios.delete(apiUrl("/api/leads/all"), { ...getAuthConfig(), params: { ...deleteFilterModal.filters, confirmDeleteAll: deleteFilterModal.activeFilters.length ? undefined : "true" } });
//       setSuccess(res.data?.message || "Leads deleted.");
//       setDeleteFilterModal(null); setSelectedLeadId(null); setSelectedLead(null);
//       fetchDeals();
//     } catch (e) { setError(e.response?.data?.message || "Failed to delete."); }
//   };

//   /* ── Sales update helper ── */
//   const submitSalesUpdate = async (payload, successMsg) => {
//     if (!selectedLeadId) return;
//     try {
//       setError(""); setSuccess("");
//       await axios.patch(apiUrl(`/api/leads/${selectedLeadId}/sales-update`), payload, getAuthConfig());
//       setSuccess(successMsg);
//       await Promise.all([fetchDeals(), loadLeadDetail(selectedLeadId)]);
//       if (payload.status === "meeting_aligned" || payload.callLog?.outcome === "meeting_aligned") closeDetail();
//     } catch (e) { setError(e.response?.data?.message || e.response?.data?.error || "Failed to update lead."); }
//   };

//   const handleSalesStatusSave = () => submitSalesUpdate({
//     status: salesStatusForm.status,
//     meetingScheduledAt: salesStatusForm.meetingScheduledAt || null,
//     meetingLocation: salesStatusForm.meetingLocation,
//     meetingType: salesStatusForm.meetingType,
//   }, salesStatusForm.status === "meeting_aligned" ? "Meeting aligned." : "Status updated.");

//   const handleSalesNoteSave = async () => {
//     if (!salesNote.trim()) return;
//     await submitSalesUpdate({ note: salesNote.trim() }, "Note added.");
//     setSalesNote("");
//   };

//   const handleSalesCallSave = async () => {
//     const { outcome } = salesCallForm;
//     await submitSalesUpdate({
//       status: outcome === "meeting_aligned" ? "meeting_aligned" : outcome === "call_back" ? "call_back" : outcome === "not_interested" ? "not_interested" : undefined,
//       meetingScheduledAt: salesCallForm.meetingScheduledAt || null,
//       meetingLocation: salesCallForm.meetingLocation,
//       meetingType: salesCallForm.meetingType,
//       callLog: { outcome, note: salesCallForm.note },
//     }, "Call logged.");
//     setSalesCallForm({ outcome: "call_back", note: "", meetingScheduledAt: salesStatusForm.meetingScheduledAt, meetingLocation: salesStatusForm.meetingLocation, meetingType: salesStatusForm.meetingType });
//   };

//   /* ── Add Deal (sales) ── */
//   const openDealModal = (lead = null) => {
//     setDealForm({
//       ...emptyDealForm,
//       clientName: lead?.name || "",
//       clientPhone: lead?.phone || "",
//       clientEmail: lead?.email || "",
//       companyName: lead?.company || "",
//       name: lead ? `Deal – ${lead.name}` : "",
//     });
//     setDealSuccess("");
//     setShowDealModal(true);
//   };

//   const handleAddDeal = async (e) => {
//     e.preventDefault();
//     try {
//       setError(""); setDealSuccess("");
//       await axios.post(DEALS_API, dealForm, getAuthConfig());
//       setDealSuccess("Deal created successfully.");
//       setDealForm(emptyDealForm);
//       setTimeout(() => { setShowDealModal(false); setDealSuccess(""); }, 1200);
//     } catch (err) {
//       setError(err.response?.data?.message || err.response?.data?.error || "Failed to create deal.");
//     }
//   };

//   /* ── Style constants ── */
//   const inp = { height: 36, fontSize: "var(--text-sm)" };
//   const sm = { height: 30, fontSize: 12 };
//   const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-2)" };
//   const secLabel = { margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-text-muted)" };

//   const locked = isMeetingAligned(selectedLead);

//   /* ════════════════════════════════════════════════════════════
//      RENDER
//   ════════════════════════════════════════════════════════════ */
//   return (
//     <div className="dashboard-container" style={{ padding: "var(--space-6)", position: "relative" }}>

//       {/* ── Header ── */}
//       <div className="page-header">
//         <div className="page-header-left">
//           <h1 className="title">Leads</h1>
//           <p className="subtitle">{isSales ? "Call, update, and qualify open leads." : "Track and manage every lead."}</p>
//         </div>
//         <div className="page-header-right" style={{ display: "flex", gap: "var(--space-3)" }}>
//           {isSuperUser && (
//             <>
//               <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
//               <button className="btn btn-ghost" onClick={handleExport}><Download size={16} /> Export</button>
//               <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Import</button>
//               <button className="btn btn-primary" onClick={() => openSuperUserModal(null)}><Plus size={16} /> New Lead</button>
//             </>
//           )}
//           {isSales && (
//             <button className="btn btn-primary" onClick={() => openDealModal()}>
//               <Plus size={16} /> Add Deal
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── Alerts ── */}
//       {error && <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-error)" }}>{error}</div>}
//       {success && <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-success)" }}>{success}</div>}

//       {/* ── Filters ── */}
//       <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
//         <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
//           <div className="form-field" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
//             <label className="form-label">Search</label>
//             <div style={{ position: "relative" }}>
//               <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
//               <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Name, email, company..." value={searchInput}
//                 onChange={(e) => setSearchInput(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && updateFilter("search", searchInput)} />
//             </div>
//           </div>
//           <div className="form-field" style={{ width: 180, marginBottom: 0 }}>
//             <label className="form-label">Status</label>
//             <select className="form-select" value={searchParams.get("status") || ""} onChange={(e) => updateFilter("status", e.target.value)}>
//               <option value="">All Status</option>
//               {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//             </select>
//           </div>
//           <div className="form-field" style={{ width: 170, marginBottom: 0 }}>
//             <label className="form-label">Date From</label>
//             <input className="form-input" type="date" value={searchParams.get("startDate") || ""} onChange={(e) => updateFilter("startDate", e.target.value)} />
//           </div>
//           <div className="form-field" style={{ width: 170, marginBottom: 0 }}>
//             <label className="form-label">Date To</label>
//             <input className="form-input" type="date" value={searchParams.get("endDate") || ""} onChange={(e) => updateFilter("endDate", e.target.value)} />
//           </div>
//           <div className="form-field" style={{ width: 170, marginBottom: 0 }}>
//             <label className="form-label">Sort By</label>
//             <select className="form-select" value={searchParams.get("sortBy") || "createdAt"} onChange={(e) => updateFilter("sortBy", e.target.value)}>
//               <option value="createdAt">Created Date</option>
//               <option value="updatedAt">Updated Date</option>
//               <option value="name">Name</option>
//               <option value="company">Company</option>
//               <option value="status">Status</option>
//             </select>
//           </div>
//           <div className="form-field" style={{ width: 140, marginBottom: 0 }}>
//             <label className="form-label">Order</label>
//             <select className="form-select" value={searchParams.get("order") || "desc"} onChange={(e) => updateFilter("order", e.target.value)}>
//               <option value="desc">Newest First</option>
//               <option value="asc">Oldest First</option>
//             </select>
//           </div>
//           <div className="form-field" style={{ width: 120, marginBottom: 0 }}>
//             <label className="form-label">Limit</label>
//             <select className="form-select" value={searchParams.get("limit") || "10"} onChange={(e) => updateFilter("limit", e.target.value)}>
//               <option value="10">10 / page</option>
//               <option value="25">25 / page</option>
//               <option value="50">50 / page</option>
//             </select>
//           </div>
//           <button className="btn btn-ghost" onClick={() => { setSearchInput(""); setSearchParams({}); }}>Clear</button>
//           {isSuperUser && (
//             <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={openDeleteFilteredModal}>
//               <Trash2 size={16} /> Delete by Filters
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── Table ── */}
//       <div className="nc-card">
//         <table className="nc-table">
//           <thead>
//             <tr>
//               {isSuperUser ? (
//                 <>
//                   <th>Lead Name</th><th>Company</th><th>Email / Phone</th>
//                   <th>Status</th><th>Created</th><th>Last Note</th><th>Last Call</th><th>Actions</th>
//                 </>
//               ) : (
//                 <>
//                   <>
//                     <th>Deal Name</th>
//                     <th>Phone</th>
//                     <th>Company</th>
//                     <th>Status</th>
//                     <th>Value</th>
//                     <th>Closed Date</th>
//                     <th>Actions</th>
//                   </>
//                 </>
//               )}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={isSuperUser ? 8 : 8} style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading leads...</td></tr>
//             ) : deals.length ? deals.map((lead) => (
//               <tr key={lead._id}>
//                 {isSuperUser ? (
//                   <>
//                     <td style={{ fontWeight: "var(--font-semibold)" }}>{lead.name}</td>
//                     <td>{lead.company || "--"}</td>
//                     <td>
//                       <div style={{ fontSize: "var(--text-xs)" }}>
//                         <div>{lead.email || "--"}</div>
//                         <div style={{ color: "var(--color-text-muted)" }}>{lead.phone || "--"}</div>
//                       </div>
//                     </td>
//                     <td><span className={`badge badge-${statusBadgeVariant(lead.status)}`}>{getStatusLabel(lead.status)}</span></td>
//                     <td>{formatDateTime(lead.createdAt)}</td>
//                     <td>{getLastNote(lead)?.text || "--"}</td>
//                     <td>{formatDateTime(getLastCall(lead)?.calledAt)}</td>
//                     <td>
//                       <div style={{ display: "flex", gap: "var(--space-2)" }}>
//                         <button className="btn btn-ghost" onClick={() => openSuperUserModal(lead)}><Pencil size={14} /></button>
//                         <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => handleDeleteLead(lead._id)}><Trash2 size={14} /></button>
//                       </div>
//                     </td>
//                   </>
//                 ) : (
//                   <>
//                     <td>{lead.name}</td>

//                     <td>{lead.phone || "--"}</td>

//                     <td>{lead.company || "--"}</td>

//                     <td>
//                       <span className={`badge badge-success`}>
//                         {lead.status}
//                       </span>
//                     </td>

//                     <td>
//                       ₹{Number(lead.value || 0).toLocaleString()}
//                     </td>

//                     <td>
//                       {lead.dealClosedAt
//                         ? new Date(lead.dealClosedAt).toLocaleDateString()
//                         : "--"}
//                     </td>

//                     <td>
//                       <button
//                         className="btn btn-primary"
//                         style={{ fontSize: 12, padding: "4px 12px" }}
//                       >
//                         View
//                       </button>
//                     </td>
//                   </>
//                 )}
//               </tr>
//             )) : (
//               <tr><td colSpan={isSuperUser ? 8 : 7} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No leads found.</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ── Pagination ── */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)", padding: "0 var(--space-2)" }}>
//         <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//           Showing {deals.length} of {pagination.totalLeads} leads
//         </span>
//         <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
//           <button className="btn btn-ghost" disabled={pagination.currentPage <= 1} onClick={() => updateFilter("page", String(pagination.currentPage - 1))}>
//             <ChevronLeft size={16} />
//           </button>
//           <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
//             Page {pagination.currentPage} of {pagination.totalPages}
//           </span>
//           <button className="btn btn-ghost" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => updateFilter("page", String(pagination.currentPage + 1))}>
//             <ChevronRight size={16} />
//           </button>
//         </div>
//       </div>

//       {/* ════════════════════════════════════════
//           SUPER USER — ADD / EDIT LEAD MODAL
//       ════════════════════════════════════════ */}
//       {showModal && (
//         <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
//           <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
//             <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//               <h3 style={{ margin: 0 }}>{editingLeadId ? "Edit Lead" : "Add New Lead"}</h3>
//               <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowModal(false)}><X size={18} /></button>
//             </div>
//             <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
//               <form id="lead-form" onSubmit={handleLeadSubmit}>
//                 <div className="form-field">
//                   <label className="form-label">Full Name *</label>
//                   <input className="form-input" style={inp} required value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} />
//                 </div>
//                 <div className="form-field">
//                   <label className="form-label">Email</label>
//                   <input className="form-input" style={inp} type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
//                 </div>
//                 <div style={grid2}>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Phone</label>
//                     <input className="form-input" style={inp} value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Company</label>
//                     <input className="form-input" style={inp} value={leadForm.company} onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })} />
//                   </div>
//                 </div>
//                 <div className="form-field" style={{ marginTop: "var(--space-3)" }}>
//                   <label className="form-label">Status</label>
//                   <select className="form-select" value={leadForm.status} onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}>
//                     {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//                   </select>
//                 </div>
//                 {leadForm.status === "meeting_aligned" && (
//                   <div style={grid2}>
//                     <div className="form-field" style={{ marginBottom: 0 }}>
//                       <label className="form-label">Meeting Date & Time *</label>
//                       <input className="form-input" style={inp} type="datetime-local" required value={leadForm.meetingScheduledAt} onChange={(e) => setLeadForm({ ...leadForm, meetingScheduledAt: e.target.value })} />
//                     </div>
//                     <div className="form-field" style={{ marginBottom: 0 }}>
//                       <label className="form-label">Meeting Type *</label>
//                       <select className="form-select" style={inp} required value={leadForm.meetingType} onChange={(e) => setLeadForm({ ...leadForm, meetingType: e.target.value })}>
//                         <option value="">Select type</option>
//                         {MEETING_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//                       </select>
//                     </div>
//                     <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                       <label className="form-label">Meeting Location *</label>
//                       <input className="form-input" style={inp} required value={leadForm.meetingLocation} onChange={(e) => setLeadForm({ ...leadForm, meetingLocation: e.target.value })} />
//                     </div>
//                   </div>
//                 )}
//                 <div className="form-field" style={{ marginTop: "var(--space-3)" }}>
//                   <label className="form-label">Add Note</label>
//                   <textarea className="form-input" rows={3} value={leadForm.note} onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })} />
//                 </div>
//               </form>
//             </div>
//             <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
//               <button form="lead-form" type="submit" className="btn btn-primary" style={{ flex: 1 }}>
//                 {leadForm.status === "meeting_aligned" ? "Align Meeting & Save" : "Save Lead"}
//               </button>
//               <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ════════════════════════════════════════
//           CSV MAPPING MODAL
//       ════════════════════════════════════════ */}
//       {importMappingModal && (
//         <div className="nc-modal-overlay" onClick={() => setImportMappingModal(null)}>
//           <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
//             <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
//               <h3 style={{ margin: 0 }}>Map CSV Fields</h3>
//               <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Match each CSV column to a lead field.</p>
//             </div>
//             <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1, display: "grid", gap: "var(--space-3)" }}>
//               {CSV_IMPORT_FIELDS.map((field) => (
//                 <div key={field.value} className="form-field" style={{ marginBottom: 0 }}>
//                   <label className="form-label">{field.label}{field.required ? " *" : ""}</label>
//                   <select className="form-select" value={importMappingModal.mapping[field.value] || ""} onChange={(e) => setImportMappingModal((p) => ({ ...p, mapping: { ...p.mapping, [field.value]: e.target.value } }))}>
//                     <option value="">Do not import</option>
//                     {importMappingModal.headers.map((h) => <option key={h} value={h}>{h}</option>)}
//                   </select>
//                 </div>
//               ))}
//             </div>
//             <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
//               <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleMappedImport}>Import Leads</button>
//               <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setImportMappingModal(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ════════════════════════════════════════
//           DELETE FILTERED MODAL
//       ════════════════════════════════════════ */}
//       {deleteFilterModal && (
//         <div className="nc-modal-overlay" onClick={() => setDeleteFilterModal(null)}>
//           <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 480, borderRadius: 12, overflow: "hidden" }}>
//             <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)" }}>
//               <h3 style={{ margin: 0 }}>Delete Filtered Leads</h3>
//             </div>
//             <div style={{ padding: "20px 24px" }}>
//               <p style={{ margin: "0 0 12px", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>This will delete all leads matching the current filters.</p>
//               <div style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
//                 <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 4 }}>Current filters</div>
//                 <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{deleteFilterModal.filterSummary}</div>
//               </div>
//               <p style={{ margin: "0 0 20px", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>This action cannot be undone.</p>
//               <div style={{ display: "flex", gap: "var(--space-3)" }}>
//                 <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteFilterModal(null)}>Cancel</button>
//                 <button className="btn btn-primary" style={{ flex: 1, background: "var(--color-error)" }} onClick={handleDeleteFilteredLeads}>Delete Leads</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ════════════════════════════════════════
//           SALES — LEAD DETAIL MODAL (tabbed)
//       ════════════════════════════════════════ */}
//       {isSales && selectedLeadId && (
//         <div className="nc-modal-overlay" onClick={closeDetail}>
//           <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 760, maxHeight: "92vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>

//             {/* sticky header */}
//             <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
//               {panelLoading ? (
//                 <div style={{ padding: "12px 0 20px", color: "var(--color-text-muted)" }}>Loading…</div>
//               ) : selectedLead ? (
//                 <>
//                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
//                     <div>
//                       <h2 style={{ margin: "0 0 6px", fontSize: "var(--text-lg)", fontWeight: 700 }}>{selectedLead.name}</h2>
//                       <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//                         <span className={`badge badge-${statusBadgeVariant(selectedLead.status)}`}>{getStatusLabel(selectedLead.status)}</span>
//                         {selectedLead.company && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{selectedLead.company}</span>}
//                         {locked && (
//                           <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", background: "var(--color-bg-muted)", padding: "2px 7px", borderRadius: 10 }}>
//                             <Lock size={10} /> Read-only
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                     <button className="btn btn-ghost" style={{ padding: 4 }} onClick={closeDetail}><X size={18} /></button>
//                   </div>
//                   <TabBar active={activeTab} onChange={setActiveTab} tabs={DETAIL_TABS} />
//                 </>
//               ) : (
//                 <div style={{ padding: "12px 0 20px", color: "var(--color-error)" }}>Failed to load lead.</div>
//               )}
//             </div>

//             {/* scrollable body */}
//             <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
//               {selectedLead && (
//                 <>
//                   {/* ══ OVERVIEW ══ */}
//                   {activeTab === "Overview" && (
//                     <div>
//                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
//                         <div>
//                           <SectionHeader icon={User} title="Contact" />
//                           <Field label="Name" value={selectedLead.name} />
//                           <Field label="Phone" value={selectedLead.phone} />
//                           <Field label="Email" value={selectedLead.email} />
//                         </div>
//                         <div>
//                           <SectionHeader icon={Building2} title="Company" />
//                           <Field label="Company" value={selectedLead.company} />
//                         </div>
//                         <div>
//                           <SectionHeader icon={Clock} title="Meeting" />
//                           {selectedLead.meetingScheduledAt ? (
//                             <>
//                               <Field label="Scheduled At" value={formatDateTime(selectedLead.meetingScheduledAt)} />
//                               <Field label="Type" value={getMeetingTypeLabel(selectedLead.meetingType)} />
//                               <Field label="Location" value={selectedLead.meetingLocation} />
//                             </>
//                           ) : (
//                             <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>No meeting scheduled.</p>
//                           )}
//                         </div>
//                       </div>

//                       {/* quick stat tiles → jump to tab */}
//                       <div style={{ display: "flex", gap: "var(--space-4)" }}>
//                         {[
//                           { label: "Notes", tab: "Notes", count: selectedLead.notes?.length ?? 0 },
//                           { label: "Calls", tab: "Call Log", count: selectedLead.callLog?.length ?? 0 },
//                         ].map(({ label, tab, count }) => (
//                           <div key={label} onClick={() => setActiveTab(tab)}
//                             style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px", cursor: "pointer", border: "1px solid transparent", transition: "border .15s" }}
//                             onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid var(--color-accent)")}
//                             onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid transparent")}>
//                             <div>
//                               <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{count}</div>
//                               <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{label}</div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>

//                       {/* Convert to Deal button */}
//                       <div style={{ marginTop: "var(--space-4)" }}>
//                         <button
//                           className="btn btn-primary"
//                           style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}
//                           onClick={() => { closeDetail(); openDealModal(selectedLead); }}
//                         >
//                           <Plus size={15} /> Convert to Deal
//                         </button>
//                       </div>

//                       {/* Change Status (only for open leads) */}
//                       {!locked && (
//                         <div style={{ marginTop: "var(--space-5)", padding: 16, background: "var(--color-bg-muted)", borderRadius: 10, border: "1px dashed var(--color-border)" }}>
//                           <p style={secLabel}>Update Status</p>
//                           <div style={grid2}>
//                             <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                               <label className="form-label">Status</label>
//                               <select className="form-select" style={sm} value={salesStatusForm.status} onChange={(e) => setSalesStatusForm({ ...salesStatusForm, status: e.target.value })}>
//                                 {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//                               </select>
//                             </div>
//                             {salesStatusForm.status === "meeting_aligned" && (
//                               <>
//                                 <div className="form-field" style={{ marginBottom: 0 }}>
//                                   <label className="form-label">Meeting Date & Time</label>
//                                   <input className="form-input" style={sm} type="datetime-local" value={salesStatusForm.meetingScheduledAt} onChange={(e) => setSalesStatusForm({ ...salesStatusForm, meetingScheduledAt: e.target.value })} />
//                                 </div>
//                                 <div className="form-field" style={{ marginBottom: 0 }}>
//                                   <label className="form-label">Meeting Type</label>
//                                   <select className="form-select" style={sm} value={salesStatusForm.meetingType} onChange={(e) => setSalesStatusForm({ ...salesStatusForm, meetingType: e.target.value })}>
//                                     <option value="">Select type</option>
//                                     {MEETING_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//                                   </select>
//                                 </div>
//                                 <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                                   <label className="form-label">Meeting Location</label>
//                                   <input className="form-input" style={sm} value={salesStatusForm.meetingLocation} onChange={(e) => setSalesStatusForm({ ...salesStatusForm, meetingLocation: e.target.value })} />
//                                 </div>
//                               </>
//                             )}
//                             <button className="btn btn-primary" style={{ gridColumn: "span 2", height: 34 }} onClick={handleSalesStatusSave}>
//                               {salesStatusForm.status === "meeting_aligned" ? "Align Meeting & Save" : "Save Status"}
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {/* ══ NOTES TAB ══ */}
//                   {activeTab === "Notes" && (
//                     <div>
//                       {locked && <ReadOnlyBanner />}

//                       {sortNotesNewest(selectedLead.notes).length ? (
//                         <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "var(--space-4)" }}>
//                           {sortNotesNewest(selectedLead.notes).map((note, i) => (
//                             <div key={note._id || i} style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px" }}>
//                               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
//                                 <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>{note.addedBy?.name || "Unknown"}</span>
//                                 <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{formatDateTime(note.addedAt)}</span>
//                               </div>
//                               <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>{note.text}</p>
//                             </div>
//                           ))}
//                         </div>
//                       ) : (
//                         <EmptyState text="No notes yet." />
//                       )}

//                       {!locked && (
//                         <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)" }}>
//                           <textarea className="form-input" rows={3} style={{ flex: 1, fontSize: "var(--text-sm)", resize: "vertical" }} placeholder="Add a new note…" value={salesNote} onChange={(e) => setSalesNote(e.target.value)} />
//                           <button className="btn btn-primary" style={{ padding: "0 16px", alignSelf: "flex-end", height: 38, display: "flex", alignItems: "center", gap: 6 }} onClick={handleSalesNoteSave}>
//                             <Send size={14} /> Save
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {/* ══ CALL LOG TAB ══ */}
//                   {activeTab === "Call Log" && (
//                     <div>
//                       {locked && <ReadOnlyBanner />}

//                       {/* existing calls — always visible */}
//                       {selectedLead.callLog?.length ? (
//                         <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "var(--space-5)" }}>
//                           {[...(selectedLead.callLog)].reverse().map((call, i) => (
//                             <div key={call._id || i} style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px" }}>
//                               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
//                                 <span className={`badge badge-${statusBadgeVariant(call.outcome)}`} style={{ fontSize: 11 }}>{getStatusLabel(call.outcome)}</span>
//                                 <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//                                   <Clock size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
//                                   {formatDateTime(call.calledAt)}
//                                 </span>
//                               </div>
//                               {call.note && <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{call.note}</p>}
//                             </div>
//                           ))}
//                         </div>
//                       ) : (
//                         <EmptyState text="No calls logged yet." />
//                       )}

//                       {/* log new call — only for open leads */}
//                       {!locked && (
//                         <div style={{ marginTop: "var(--space-5)", padding: 16, background: "var(--color-bg-muted)", borderRadius: 10, border: "1px dashed var(--color-border)" }}>
//                           <p style={secLabel}>Log New Call</p>
//                           <div style={grid2}>
//                             <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                               <label className="form-label">Outcome</label>
//                               <select className="form-select" style={sm} value={salesCallForm.outcome} onChange={(e) => setSalesCallForm({ ...salesCallForm, outcome: e.target.value })}>
//                                 {CALL_OUTCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//                               </select>
//                             </div>
//                             {salesCallForm.outcome === "meeting_aligned" && (
//                               <>
//                                 <div className="form-field" style={{ marginBottom: 0 }}>
//                                   <label className="form-label">Meeting Date & Time</label>
//                                   <input className="form-input" style={sm} type="datetime-local" value={salesCallForm.meetingScheduledAt} onChange={(e) => setSalesCallForm({ ...salesCallForm, meetingScheduledAt: e.target.value })} />
//                                 </div>
//                                 <div className="form-field" style={{ marginBottom: 0 }}>
//                                   <label className="form-label">Meeting Type</label>
//                                   <select className="form-select" style={sm} value={salesCallForm.meetingType} onChange={(e) => setSalesCallForm({ ...salesCallForm, meetingType: e.target.value })}>
//                                     <option value="">Select type</option>
//                                     {MEETING_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//                                   </select>
//                                 </div>
//                                 <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                                   <label className="form-label">Meeting Location</label>
//                                   <input className="form-input" style={sm} value={salesCallForm.meetingLocation} onChange={(e) => setSalesCallForm({ ...salesCallForm, meetingLocation: e.target.value })} />
//                                 </div>
//                               </>
//                             )}
//                             <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                               <label className="form-label">Call Note</label>
//                               <textarea className="form-input" rows={2} maxLength={500} style={{ fontSize: 12, resize: "vertical" }} placeholder="Brief note about the call…" value={salesCallForm.note} onChange={(e) => setSalesCallForm({ ...salesCallForm, note: e.target.value })} />
//                             </div>
//                             <button className="btn btn-primary" style={{ gridColumn: "span 2", height: 34 }} onClick={handleSalesCallSave}>
//                               Log Call
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>

//             {/* sticky footer */}
//             <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
//               <button className="btn btn-ghost" onClick={closeDetail}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ════════════════════════════════════════
//           ADD DEAL MODAL (sales team)
//       ════════════════════════════════════════ */}
//       {showDealModal && (
//         <div className="nc-modal-overlay" onClick={() => setShowDealModal(false)}>
//           <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>

//             {/* header */}
//             <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//               <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Add New Deal</h3>
//               <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowDealModal(false)}><X size={18} /></button>
//             </div>

//             {/* scrollable body */}
//             <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
//               {dealSuccess && (
//                 <div style={{ marginBottom: "var(--space-4)", padding: "10px 14px", background: "var(--color-success-muted, #f0fdf4)", color: "var(--color-success)", borderRadius: 8, fontSize: "var(--text-sm)", fontWeight: 500 }}>
//                   {dealSuccess}
//                 </div>
//               )}
//               <form id="deal-form-leads" onSubmit={handleAddDeal}>

//                 <p style={secLabel}>Deal Details</p>
//                 <div style={{ ...grid2, marginBottom: "var(--space-5)" }}>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Deal Name *</label>
//                     <input className="form-input" style={inp} required value={dealForm.name} onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Deal Value (₹)</label>
//                     <input className="form-input" style={inp} type="number" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Expected Close Date</label>
//                     <input className="form-input" style={inp} type="date" value={dealForm.expectedCloseDate} onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Description</label>
//                     <textarea className="form-input" rows={2} value={dealForm.description} onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })} />
//                   </div>
//                 </div>

//                 <p style={secLabel}>Client Info</p>
//                 <div style={{ ...grid2, marginBottom: "var(--space-5)" }}>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Client Name *</label>
//                     <input className="form-input" style={inp} required value={dealForm.clientName} onChange={(e) => setDealForm({ ...dealForm, clientName: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Phone *</label>
//                     <input className="form-input" style={inp} required value={dealForm.clientPhone} onChange={(e) => setDealForm({ ...dealForm, clientPhone: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Email</label>
//                     <input className="form-input" style={inp} type="email" value={dealForm.clientEmail} onChange={(e) => setDealForm({ ...dealForm, clientEmail: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Company</label>
//                     <input className="form-input" style={inp} value={dealForm.companyName} onChange={(e) => setDealForm({ ...dealForm, companyName: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Business URL</label>
//                     <input className="form-input" style={inp} value={dealForm.businessUrl} onChange={(e) => setDealForm({ ...dealForm, businessUrl: e.target.value })} />
//                   </div>
//                 </div>

//                 <p style={secLabel}>Initial Logs (optional)</p>
//                 <div style={grid2}>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Initial Comment</label>
//                     <input className="form-input" style={inp} value={dealForm.initialComment} onChange={(e) => setDealForm({ ...dealForm, initialComment: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Meeting Link</label>
//                     <input className="form-input" style={inp} value={dealForm.meetingLink} onChange={(e) => setDealForm({ ...dealForm, meetingLink: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Meeting Time</label>
//                     <input className="form-input" style={inp} type="datetime-local" value={dealForm.meetingTime} onChange={(e) => setDealForm({ ...dealForm, meetingTime: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Meeting Discussion</label>
//                     <input className="form-input" style={inp} value={dealForm.meetingDiscussion} onChange={(e) => setDealForm({ ...dealForm, meetingDiscussion: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Reminder Date</label>
//                     <input className="form-input" style={inp} type="datetime-local" value={dealForm.reminderDate} onChange={(e) => setDealForm({ ...dealForm, reminderDate: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Reminder Note</label>
//                     <input className="form-input" style={inp} value={dealForm.reminderNote} onChange={(e) => setDealForm({ ...dealForm, reminderNote: e.target.value })} />
//                   </div>
//                 </div>
//               </form>
//             </div>

//             {/* footer */}
//             <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
//               <button form="deal-form-leads" type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Deal</button>
//               <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowDealModal(false)}>Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }

// export default Leads;




import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeft, ChevronRight, Download, Pencil, Plus,
  Search, Trash2, Upload, X, User, Building2,
  Lock, Send, Clock, Link2, Bell,
} from "lucide-react";

import { apiUrl } from "../../config/api";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
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

const DEAL_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
];

const DETAIL_TABS = ["Overview", "Notes", "Call Log"];
const DEALS_API = apiUrl("/api/deals");

const emptyDealForm = {
  name: "", clientName: "", clientPhone: "", clientEmail: "",
  companyName: "", businessUrl: "", description: "", value: "",
  expectedCloseDate: "", initialComment: "", meetingLink: "",
  meetingTime: "", meetingDiscussion: "", reminderDate: "", reminderNote: "",
};

const emptyLeadForm = {
  name: "", email: "", phone: "", company: "",
  status: "call_back", note: "",
  meetingScheduledAt: "", meetingLocation: "", meetingType: "",
};

const emptySalesStatusForm = {
  status: "call_back", meetingScheduledAt: "",
  meetingLocation: "", meetingType: "",
};

const emptySalesCallForm = {
  outcome: "call_back", note: "",
  meetingScheduledAt: "", meetingLocation: "", meetingType: "",
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const normalizeRole = (r) => String(r || "").trim().toLowerCase();
const normalizeCsvHeader = (v) => String(v || "").trim().toLowerCase();
const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } });
const getStatusLabel = (s) => STATUS_OPTIONS.find((o) => o.value === s)?.label || s || "--";
const getMeetingTypeLabel = (t) => MEETING_TYPE_OPTIONS.find((o) => o.value === t)?.label || t || "--";
const getLastNote = (r) => Array.isArray(r.notes) && r.notes.length ? r.notes[r.notes.length - 1] : null;
const getLastCall = (r) => Array.isArray(r.callLog) && r.callLog.length ? r.callLog[r.callLog.length - 1] : null;
const sortNotesNewest = (n) => [...(Array.isArray(n) ? n : [])].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
const isMeetingAligned = (l) => l?.status === "meeting_aligned";

const formatDateTime = (v) => {
  if (!v) return "--";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "--" : d.toLocaleString();
};

const toInputDateTime = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const parseCsvLine = (line) => {
  const values = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } continue; }
    if (c === ',' && !inQ) { values.push(cur); cur = ""; continue; }
    cur += c;
  }
  values.push(cur);
  return values.map((v) => v.trim());
};

const readCsvHeaders = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => { const l = String(r.result || "").split(/\r?\n/).find((x) => x.trim()); res(l ? parseCsvLine(l) : []); };
  r.onerror = () => rej(r.error);
  r.readAsText(file);
});

const buildDefaultCsvMapping = (headers) => {
  const norm = headers.map(normalizeCsvHeader);
  return CSV_IMPORT_FIELDS.reduce((map, field) => {
    const idx = norm.indexOf(normalizeCsvHeader(field.value));
    map[field.value] = idx >= 0 ? headers[idx] : "";
    return map;
  }, {});
};

/* ─────────────────────────────────────────────────────────────
   BADGE HELPERS
───────────────────────────────────────────────────────────── */
const leadStatusBadgeVariant = (s) =>
  s === "not_interested" ? "error"
    : s === "meeting_aligned" ? "success"
      : "warning";

const dealStatusBadgeVariant = (s) => {
  const n = String(s || "").toLowerCase();
  if (n === "won") return "success";
  if (n === "lost") return "error";
  if (n === "pending" || n === "in_progress") return "warning";
  return "info";
};

const getDealStatusLabel = (s) =>
  DEAL_STATUS_OPTIONS.find((o) => o.value === String(s || "").toLowerCase())?.label
  || (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "--");

/* ─────────────────────────────────────────────────────────────
   SMALL SHARED COMPONENTS
───────────────────────────────────────────────────────────── */
const Field = ({ label, value }) => (
  <div style={{ marginBottom: "var(--space-3)" }}>
    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 2 }}>{label}</span>
    <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{value || "—"}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--space-3)" }}>
    <Icon size={15} style={{ color: "var(--color-accent)" }} />
    <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>{title}</h4>
  </div>
);

const EmptyState = ({ text }) => (
  <p style={{ margin: 0, padding: "12px 14px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", background: "var(--color-bg-muted)", borderRadius: 8 }}>{text}</p>
);

const ReadOnlyBanner = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px", marginBottom: "var(--space-4)" }}>
    <Lock size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
      This lead is <strong>Meeting Aligned</strong>. Records are read-only.
    </p>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   TAB BAR
───────────────────────────────────────────────────────────── */
const TabBar = ({ active, onChange, tabs }) => (
  <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "var(--space-5)" }}>
    {tabs.map((t) => (
      <button key={t} onClick={() => onChange(t)} style={{
        background: "none", border: "none", padding: "10px 16px",
        fontSize: "var(--text-sm)", fontWeight: active === t ? 600 : 400,
        color: active === t ? "var(--color-accent)" : "var(--color-text)",
        borderBottom: active === t ? "2px solid var(--color-accent)" : "2px solid transparent",
        cursor: "pointer", marginBottom: -1, transition: "color .15s",
      }}>{t}</button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── list state ── */
  const [deals, setDeals] = useState([]);
  const [pagination, setPagination] = useState({ totalLeads: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ── super-user lead modal ── */
  const [showModal, setShowModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);

  /* ── search input (local) ── */
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  /* ── deal detail modal (sales) ── */
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  /* ── sales forms (for lead-based detail; kept for super_user lead detail) ── */
  const [salesStatusForm, setSalesStatusForm] = useState(emptySalesStatusForm);
  const [salesNote, setSalesNote] = useState("");
  const [salesCallForm, setSalesCallForm] = useState(emptySalesCallForm);

  /* ── import / delete ── */
  const [importMappingModal, setImportMappingModal] = useState(null);
  const [deleteFilterModal, setDeleteFilterModal] = useState(null);
  const fileInputRef = useRef(null);

  /* ── add-deal modal ── */
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForm, setDealForm] = useState(emptyDealForm);
  const [dealSuccess, setDealSuccess] = useState("");

  const userRole = normalizeRole(localStorage.getItem("userRole"));
  const isSuperUser = userRole === "super_user";
  const isSales = userRole === "sales";

  /* ── URL filter helper ── */
  const updateFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      if (key !== "page") next.set("page", "1");
      return next;
    });
  };

  /* ── fetch list ─────────────────────────────────────────── */
  const fetchDeals = async () => {
    try {
      setLoading(true);
      // Both super_user and sales fetch from /api/deals.
      // Server-side: super_user → all deals (no filter); sales → own deals (assignedTo filter).
      const url = apiUrl("/api/deals");
      const params = {};
      const res = await axios.get(url, { ...getAuthConfig(), params });
      const body = res.data;
      // support { data: [] } or { deals: [] } or plain []
      const rows = body?.data ?? body?.deals ?? (Array.isArray(body) ? body : []);
      setDeals(rows);
      if (body?.pagination) setPagination(body.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  /* ── load single deal detail (sales) ── */
  const loadDealDetail = async (id) => {
    if (!id) { setSelectedDeal(null); return; }
    try {
      setPanelLoading(true);
      const res = await axios.get(apiUrl(`/api/deals/${id}`), getAuthConfig());
      const deal = res.data?.data ?? res.data?.deal ?? res.data;
      setSelectedDeal(deal || null);
      // pre-populate status form with lead-like fields if they exist
      setSalesStatusForm({
        status: deal?.status || "call_back",
        meetingScheduledAt: toInputDateTime(deal?.meetingScheduledAt || deal?.meetingTime),
        meetingLocation: deal?.meetingLocation || "",
        meetingType: deal?.meetingType || "",
      });
      setSalesCallForm({
        outcome: "call_back", note: "",
        meetingScheduledAt: toInputDateTime(deal?.meetingScheduledAt || deal?.meetingTime),
        meetingLocation: deal?.meetingLocation || "",
        meetingType: deal?.meetingType || "",
      });
      setSalesNote("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load deal details.");
    } finally {
      setPanelLoading(false);
    }
  };

  useEffect(() => { fetchDeals(); }, [searchParams]);
  useEffect(() => { if (selectedDealId) loadDealDetail(selectedDealId); }, [selectedDealId]);

  /* ── open modals ── */
  const openSuperUserModal = (lead) => {
    setEditingLeadId(lead?._id || null);
    setLeadForm(lead ? {
      name: lead.name || "", email: lead.email || "", phone: lead.phone || "",
      company: lead.company || "", status: lead.status || "call_back", note: "",
      meetingScheduledAt: toInputDateTime(lead.meetingScheduledAt),
      meetingLocation: lead.meetingLocation || "", meetingType: lead.meetingType || "",
    } : emptyLeadForm);
    setShowModal(true);
  };

  const openDealDetail = (deal) => {
    setSelectedDealId(deal._id);
    setActiveTab("Overview");
  };

  const closeDetail = () => { setSelectedDealId(null); setSelectedDeal(null); };

  /* ── CRUD (super_user leads) ── */
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(""); setSuccess("");
      const payload = { ...leadForm, meetingScheduledAt: leadForm.meetingScheduledAt || null };
      if (editingLeadId) {
        await axios.put(apiUrl(`/api/leads/${editingLeadId}`), payload, getAuthConfig());
        setSuccess("Lead updated successfully.");
      } else {
        await axios.post(apiUrl("/api/leads"), payload, getAuthConfig());
        setSuccess("Lead created successfully.");
      }
      setShowModal(false); setLeadForm(emptyLeadForm); setEditingLeadId(null);
      fetchDeals();
    } catch (e) { setError(e.response?.data?.message || e.response?.data?.error || "Failed to save lead."); }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await axios.delete(apiUrl(`/api/leads/${id}`), getAuthConfig());
      setSuccess("Lead deleted."); fetchDeals();
    } catch (e) { setError(e.response?.data?.message || "Failed to delete lead."); }
  };

  /* ── Export / Import ── */
  const handleExport = async () => {
    try {
      const res = await axios.get(apiUrl("/api/leads/export"), { ...getAuthConfig(), params: Object.fromEntries(searchParams.entries()), responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = "leads_export.csv"; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { setError(e.response?.data?.message || "Failed to export."); }
  };

  const uploadLeadFile = async (file, fieldMapping = null) => {
    const fd = new FormData();
    fd.append("file", file);
    if (fieldMapping) fd.append("fieldMapping", JSON.stringify(fieldMapping));
    await axios.post(apiUrl("/api/leads/import"), fd, { ...getAuthConfig(), headers: { ...getAuthConfig().headers, "Content-Type": "multipart/form-data" } });
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setError(""); setSuccess("");
      const headers = await readCsvHeaders(file);
      const mapping = buildDefaultCsvMapping(headers);
      const recognized = Object.values(mapping).filter(Boolean).length;
      if (!mapping.name || recognized < Math.min(headers.length, 2)) { setImportMappingModal({ file, headers, mapping }); return; }
      await uploadLeadFile(file);
      setSuccess("Leads imported successfully."); fetchDeals();
    } catch (e) { setError(e.response?.data?.message || "Failed to import."); }
    finally { e.target.value = ""; }
  };

  const handleMappedImport = async () => {
    if (!importMappingModal?.file) return;
    if (!importMappingModal.mapping.name) { setError("Please map the Full Name field."); return; }
    try {
      setError(""); setSuccess("");
      await uploadLeadFile(importMappingModal.file, importMappingModal.mapping);
      setImportMappingModal(null); setSuccess("Leads imported successfully."); fetchDeals();
    } catch (e) { setError(e.response?.data?.message || "Failed to import."); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const openDeleteFilteredModal = () => {
    const filters = Object.fromEntries(searchParams.entries());
    const active = ["status", "search", "startDate", "endDate"].filter((k) => filters[k]);
    setDeleteFilterModal({ filters, activeFilters: active, filterSummary: active.length ? active.map((k) => `${k}: ${filters[k]}`).join(", ") : "no filters" });
  };

  const handleDeleteFilteredLeads = async () => {
    if (!deleteFilterModal) return;
    try {
      setError(""); setSuccess("");
      const res = await axios.delete(apiUrl("/api/leads/all"), { ...getAuthConfig(), params: { ...deleteFilterModal.filters, confirmDeleteAll: deleteFilterModal.activeFilters.length ? undefined : "true" } });
      setSuccess(res.data?.message || "Leads deleted.");
      setDeleteFilterModal(null); setSelectedDealId(null); setSelectedDeal(null);
      fetchDeals();
    } catch (e) { setError(e.response?.data?.message || "Failed to delete."); }
  };

  /* ── Sales update helpers (for lead-detail, if super_user opens a lead) ── */
  const submitSalesUpdate = async (payload, successMsg) => {
    if (!selectedDeal) return;
    const targetId = selectedDeal.sourceLead?._id || selectedDeal.sourceLead || selectedDeal._id || selectedDealId;
    try {
      setError(""); setSuccess("");
      await axios.patch(apiUrl(`/api/leads/${targetId}/sales-update`), payload, getAuthConfig());
      setSuccess(successMsg);
      await Promise.all([fetchDeals(), loadDealDetail(selectedDeal._id || selectedDealId)]);
      if (payload.status === "meeting_aligned" || payload.callLog?.outcome === "meeting_aligned") closeDetail();
    } catch (e) { setError(e.response?.data?.message || e.response?.data?.error || "Failed to update."); }
  };

  const handleDealStatusChange = async (dealId, newStatus) => {
    try {
      setError(""); setSuccess("");
      if (newStatus === "Won") {
        await axios.patch(apiUrl(`/api/deals/${dealId}/won`), {}, getAuthConfig());
      } else if (newStatus === "Lost") {
        await axios.patch(apiUrl(`/api/deals/${dealId}/lost`), {}, getAuthConfig());
      } else {
        await axios.put(apiUrl(`/api/deals/${dealId}`), { status: newStatus }, getAuthConfig());
      }
      setSuccess("Deal status updated successfully.");
      fetchDeals();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || "Failed to update deal status.");
    }
  };

  const handleSalesStatusSave = () => submitSalesUpdate({
    status: salesStatusForm.status,
    meetingScheduledAt: salesStatusForm.meetingScheduledAt || null,
    meetingLocation: salesStatusForm.meetingLocation,
    meetingType: salesStatusForm.meetingType,
  }, salesStatusForm.status === "meeting_aligned" ? "Meeting aligned." : "Status updated.");

  const handleSalesNoteSave = async () => {
    if (!salesNote.trim()) return;
    await submitSalesUpdate({ note: salesNote.trim() }, "Note added.");
    setSalesNote("");
  };

  const handleSalesCallSave = async () => {
    const { outcome } = salesCallForm;
    await submitSalesUpdate({
      status: outcome === "meeting_aligned" ? "meeting_aligned" : outcome === "call_back" ? "call_back" : outcome === "not_interested" ? "not_interested" : undefined,
      meetingScheduledAt: salesCallForm.meetingScheduledAt || null,
      meetingLocation: salesCallForm.meetingLocation,
      meetingType: salesCallForm.meetingType,
      callLog: { outcome, note: salesCallForm.note },
    }, "Call logged.");
    setSalesCallForm({ outcome: "call_back", note: "", meetingScheduledAt: salesStatusForm.meetingScheduledAt, meetingLocation: salesStatusForm.meetingLocation, meetingType: salesStatusForm.meetingType });
  };

  /* ── Add Deal modal ── */
  const openDealModal = (source = null) => {
    setDealForm({
      ...emptyDealForm,
      clientName: source?.clientName || source?.name || "",
      clientPhone: source?.clientPhone || source?.phone || "",
      clientEmail: source?.clientEmail || source?.email || "",
      companyName: source?.companyName || source?.company || "",
      name: source ? `Deal – ${source.clientName || source.name || ""}` : "",
    });
    setDealSuccess("");
    setShowDealModal(true);
  };

  const handleAddDeal = async (e) => {
    e.preventDefault();
    try {
      setError(""); setDealSuccess("");
      await axios.post(DEALS_API, dealForm, getAuthConfig());
      setDealSuccess("Deal created successfully.");
      setDealForm(emptyDealForm);
      setTimeout(() => { setShowDealModal(false); setDealSuccess(""); fetchDeals(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to create deal.");
    }
  };

  /* ── Style shortcuts ── */
  const inp = { height: 36, fontSize: "var(--text-sm)" };
  const sm = { height: 30, fontSize: 12 };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-2)" };
  const secLabel = { margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-text-muted)" };

  const locked = isMeetingAligned(selectedDeal);

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)", position: "relative" }}>

      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Leads</h1>
          <p className="subtitle">{isSales ? "Call, update, and qualify open leads." : "Track and manage every lead."}</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-3)" }}>
          {isSuperUser && (
            <>
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
              <button className="btn btn-ghost" onClick={handleExport}><Download size={16} /> Export</button>
              <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Import</button>
              <button className="btn btn-primary" onClick={() => openSuperUserModal(null)}><Plus size={16} /> New Lead</button>
            </>
          )}
          {isSales && (
            <button className="btn btn-primary" onClick={() => openDealModal()}>
              <Plus size={16} /> Add Deal
            </button>
          )}
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-error)" }}>{error}</div>}
      {success && <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-success)" }}>{success}</div>}

      {/* ── Filters ── */}
      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Search — works for both roles */}
          <div className="form-field" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder={isSales ? "Deal name, client, company…" : "Name, email, company…"}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateFilter("search", searchInput)}
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="form-field" style={{ width: 180, marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={searchParams.get("status") || ""} onChange={(e) => updateFilter("status", e.target.value)}>
              <option value="">All Status</option>
              {(isSales ? DEAL_STATUS_OPTIONS : STATUS_OPTIONS).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="form-field" style={{ width: 170, marginBottom: 0 }}>
            <label className="form-label">Date From</label>
            <input className="form-input" type="date" value={searchParams.get("startDate") || ""} onChange={(e) => updateFilter("startDate", e.target.value)} />
          </div>
          <div className="form-field" style={{ width: 170, marginBottom: 0 }}>
            <label className="form-label">Date To</label>
            <input className="form-input" type="date" value={searchParams.get("endDate") || ""} onChange={(e) => updateFilter("endDate", e.target.value)} />
          </div>

          {/* Sort — super_user only (deals backend may not support it) */}
          {isSuperUser && (
            <>
              <div className="form-field" style={{ width: 170, marginBottom: 0 }}>
                <label className="form-label">Sort By</label>
                <select className="form-select" value={searchParams.get("sortBy") || "createdAt"} onChange={(e) => updateFilter("sortBy", e.target.value)}>
                  <option value="createdAt">Created Date</option>
                  <option value="updatedAt">Updated Date</option>
                  <option value="name">Name</option>
                  <option value="company">Company</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div className="form-field" style={{ width: 140, marginBottom: 0 }}>
                <label className="form-label">Order</label>
                <select className="form-select" value={searchParams.get("order") || "desc"} onChange={(e) => updateFilter("order", e.target.value)}>
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div className="form-field" style={{ width: 120, marginBottom: 0 }}>
                <label className="form-label">Limit</label>
                <select className="form-select" value={searchParams.get("limit") || "10"} onChange={(e) => updateFilter("limit", e.target.value)}>
                  <option value="10">10 / page</option>
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                </select>
              </div>
            </>
          )}

          <button className="btn btn-ghost" onClick={() => { setSearchInput(""); setSearchParams({}); }}>Clear</button>

          {isSuperUser && (
            <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={openDeleteFilteredModal}>
              <Trash2 size={16} /> Delete by Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>Deal Name</th><th>Client</th><th>Phone</th>
              <th>Company</th><th>Status</th><th>Value</th><th>Close Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading…</td></tr>
            ) : deals.length ? deals.map((row) => (
              <tr key={row._id}>
                <td style={{ fontWeight: "var(--font-semibold)" }}>{row.name || "--"}</td>
                <td>{row.clientName || "--"}</td>
                <td>{row.clientPhone || "--"}</td>
                <td>{row.companyName || "--"}</td>
                <td>
                  <span className={`badge badge-${dealStatusBadgeVariant(row.status)}`}>
                    {getDealStatusLabel(row.status)}
                  </span>
                </td>
                <td>₹{Number(row.value || 0).toLocaleString()}</td>
                <td>
                  {row.dealClosedAt
                    ? new Date(row.dealClosedAt).toLocaleDateString()
                    : row.expectedCloseDate
                      ? new Date(row.expectedCloseDate).toLocaleDateString()
                      : "--"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 12, padding: "4px 12px" }}
                      onClick={() => openDealDetail(row)}
                    >
                      View
                    </button>
                    {(isSales || isSuperUser) && (
                      <select
                        className="form-select"
                        style={{ height: 26, padding: "2px 8px", fontSize: 12, width: "auto" }}
                        value={row.status}
                        onChange={(e) => handleDealStatusChange(row._id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)", padding: "0 var(--space-2)" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Showing {deals.length} of {pagination.totalLeads || deals.length} records
        </span>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <button className="btn btn-ghost" disabled={pagination.currentPage <= 1} onClick={() => updateFilter("page", String(pagination.currentPage - 1))}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button className="btn btn-ghost" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => updateFilter("page", String(pagination.currentPage + 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SUPER USER — ADD / EDIT LEAD MODAL
      ════════════════════════════════════════ */}
      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h3 style={{ margin: 0 }}>{editingLeadId ? "Edit Lead" : "Add New Lead"}</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
              <form id="lead-form" onSubmit={handleLeadSubmit}>
                <div className="form-field">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" style={inp} required value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" style={inp} type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
                </div>
                <div style={grid2}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone</label>
                    <input className="form-input" style={inp} value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Company</label>
                    <input className="form-input" style={inp} value={leadForm.company} onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })} />
                  </div>
                </div>
                <div className="form-field" style={{ marginTop: "var(--space-3)" }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={leadForm.status} onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}>
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {leadForm.status === "meeting_aligned" && (
                  <div style={grid2}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="form-label">Meeting Date & Time *</label>
                      <input className="form-input" style={inp} type="datetime-local" required value={leadForm.meetingScheduledAt} onChange={(e) => setLeadForm({ ...leadForm, meetingScheduledAt: e.target.value })} />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="form-label">Meeting Type *</label>
                      <select className="form-select" style={inp} required value={leadForm.meetingType} onChange={(e) => setLeadForm({ ...leadForm, meetingType: e.target.value })}>
                        <option value="">Select type</option>
                        {MEETING_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                      <label className="form-label">Meeting Location *</label>
                      <input className="form-input" style={inp} required value={leadForm.meetingLocation} onChange={(e) => setLeadForm({ ...leadForm, meetingLocation: e.target.value })} />
                    </div>
                  </div>
                )}
                <div className="form-field" style={{ marginTop: "var(--space-3)" }}>
                  <label className="form-label">Add Note</label>
                  <textarea className="form-input" rows={3} value={leadForm.note} onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })} />
                </div>
              </form>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
              <button form="lead-form" type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {leadForm.status === "meeting_aligned" ? "Align Meeting & Save" : "Save Lead"}
              </button>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          CSV MAPPING MODAL
      ════════════════════════════════════════ */}
      {importMappingModal && (
        <div className="nc-modal-overlay" onClick={() => setImportMappingModal(null)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
              <h3 style={{ margin: 0 }}>Map CSV Fields</h3>
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Match each CSV column to a lead field.</p>
            </div>
            <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1, display: "grid", gap: "var(--space-3)" }}>
              {CSV_IMPORT_FIELDS.map((field) => (
                <div key={field.value} className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">{field.label}{field.required ? " *" : ""}</label>
                  <select className="form-select" value={importMappingModal.mapping[field.value] || ""} onChange={(e) => setImportMappingModal((p) => ({ ...p, mapping: { ...p.mapping, [field.value]: e.target.value } }))}>
                    <option value="">Do not import</option>
                    {importMappingModal.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleMappedImport}>Import Leads</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setImportMappingModal(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DELETE FILTERED MODAL
      ════════════════════════════════════════ */}
      {deleteFilterModal && (
        <div className="nc-modal-overlay" onClick={() => setDeleteFilterModal(null)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 480, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)" }}>
              <h3 style={{ margin: 0 }}>Delete Filtered Leads</h3>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ margin: "0 0 12px", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>This will delete all leads matching the current filters.</p>
              <div style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 4 }}>Current filters</div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{deleteFilterModal.filterSummary}</div>
              </div>
              <p style={{ margin: "0 0 20px", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>This action cannot be undone.</p>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteFilterModal(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1, background: "var(--color-error)" }} onClick={handleDeleteFilteredLeads}>Delete Leads</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          SALES — DEAL DETAIL MODAL (tabbed)
          Calls GET /api/deals/:id  (NOT /api/leads/:id)
      ════════════════════════════════════════ */}
      {(isSales || isSuperUser) && selectedDealId && (
        <div className="nc-modal-overlay" onClick={closeDetail}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 760, maxHeight: "92vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>

            {/* sticky header */}
            <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
              {panelLoading ? (
                <div style={{ padding: "12px 0 20px", color: "var(--color-text-muted)" }}>Loading…</div>
              ) : selectedDeal ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h2 style={{ margin: "0 0 4px", fontSize: "var(--text-lg)", fontWeight: 700 }}>{selectedDeal.name}</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className={`badge badge-${dealStatusBadgeVariant(selectedDeal.status)}`}>
                          {getDealStatusLabel(selectedDeal.status)}
                        </span>
                        {selectedDeal.companyName && (
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{selectedDeal.companyName}</span>
                        )}
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>
                          ₹{Number(selectedDeal.value || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: 4 }} onClick={closeDetail}><X size={18} /></button>
                  </div>
                  <TabBar active={activeTab} onChange={setActiveTab} tabs={DETAIL_TABS} />
                </>
              ) : (
                <div style={{ padding: "12px 0 20px", color: "var(--color-error)" }}>Failed to load deal.</div>
              )}
            </div>

            {/* scrollable body */}
            <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
              {selectedDeal && (
                <>
                  {/* ── OVERVIEW ── */}
                  {activeTab === "Overview" && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
                        <div>
                          <SectionHeader icon={User} title="Client" />
                          <Field label="Name" value={selectedDeal.clientName} />
                          <Field label="Phone" value={selectedDeal.clientPhone} />
                          <Field label="Email" value={selectedDeal.clientEmail} />
                        </div>
                        <div>
                          <SectionHeader icon={Building2} title="Company" />
                          <Field label="Company" value={selectedDeal.companyName} />
                          <Field label="Business URL" value={selectedDeal.businessUrl} />
                        </div>
                        <div>
                          <SectionHeader icon={Clock} title="Deal" />
                          <Field label="Value" value={selectedDeal.value ? `₹${Number(selectedDeal.value).toLocaleString()}` : null} />
                          <Field label="Expected Close" value={selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString() : null} />
                          <Field label="Description" value={selectedDeal.description} />
                        </div>
                      </div>

                      {/* Meeting info if present */}
                      {(selectedDeal.meetingTime || selectedDeal.meetingLink) && (
                        <div style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "12px 14px", marginBottom: "var(--space-4)" }}>
                          <p style={{ ...secLabel, margin: "0 0 8px" }}>Meeting</p>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
                            <Field label="Time" value={formatDateTime(selectedDeal.meetingTime)} />
                            <Field label="Link" value={selectedDeal.meetingLink} />
                            <Field label="Discussion" value={selectedDeal.meetingDiscussion} />
                          </div>
                        </div>
                      )}

                      {/* Reminder if present */}
                      {selectedDeal.reminderDate && (
                        <div style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "12px 14px", marginBottom: "var(--space-4)" }}>
                          <p style={{ ...secLabel, margin: "0 0 8px" }}>Reminder</p>
                          <Field label="Date" value={formatDateTime(selectedDeal.reminderDate)} />
                          <Field label="Note" value={selectedDeal.reminderNote} />
                        </div>
                      )}

                      {/* Quick stat tiles */}
                      <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                        {[
                          { label: "Notes", tab: "Notes", count: selectedDeal.notes?.length ?? 0 },
                          { label: "Calls", tab: "Call Log", count: selectedDeal.callLog?.length ?? 0 },
                        ].map(({ label, tab, count }) => (
                          <div key={label} onClick={() => setActiveTab(tab)}
                            style={{ flex: 1, background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px", cursor: "pointer", border: "1px solid transparent", transition: "border .15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid var(--color-accent)")}
                            onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid transparent")}>
                            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{count}</div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Initial comment */}
                      {selectedDeal.initialComment && (
                        <div style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px" }}>
                          <p style={{ ...secLabel, margin: "0 0 4px" }}>Initial Comment</p>
                          <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>{selectedDeal.initialComment}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── NOTES TAB ── */}
                  {activeTab === "Notes" && (
                    <div>
                      {locked && <ReadOnlyBanner />}
                      {sortNotesNewest(selectedDeal.notes).length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "var(--space-4)" }}>
                          {sortNotesNewest(selectedDeal.notes).map((note, i) => (
                            <div key={note._id || i} style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>{note.addedBy?.name || "Unknown"}</span>
                                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{formatDateTime(note.addedAt)}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>{note.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState text="No notes yet." />}
                      {!locked && (
                        <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)" }}>
                          <textarea className="form-input" rows={3} style={{ flex: 1, fontSize: "var(--text-sm)", resize: "vertical" }} placeholder="Add a new note…" value={salesNote} onChange={(e) => setSalesNote(e.target.value)} />
                          <button className="btn btn-primary" style={{ padding: "0 16px", alignSelf: "flex-end", height: 38, display: "flex", alignItems: "center", gap: 6 }} onClick={handleSalesNoteSave}>
                            <Send size={14} /> Save
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── CALL LOG TAB ── */}
                  {activeTab === "Call Log" && (
                    <div>
                      {locked && <ReadOnlyBanner />}
                      {selectedDeal.callLog?.length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "var(--space-5)" }}>
                          {[...selectedDeal.callLog].reverse().map((call, i) => (
                            <div key={call._id || i} style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span className={`badge badge-${leadStatusBadgeVariant(call.outcome)}`} style={{ fontSize: 11 }}>{getStatusLabel(call.outcome)}</span>
                                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                  <Clock size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                                  {formatDateTime(call.calledAt)}
                                </span>
                              </div>
                              {call.note && <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{call.note}</p>}
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState text="No calls logged yet." />}

                      {!locked && (
                        <div style={{ marginTop: "var(--space-5)", padding: 16, background: "var(--color-bg-muted)", borderRadius: 10, border: "1px dashed var(--color-border)" }}>
                          <p style={secLabel}>Log New Call</p>
                          <div style={grid2}>
                            <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                              <label className="form-label">Outcome</label>
                              <select className="form-select" style={sm} value={salesCallForm.outcome} onChange={(e) => setSalesCallForm({ ...salesCallForm, outcome: e.target.value })}>
                                {CALL_OUTCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>
                            {salesCallForm.outcome === "meeting_aligned" && (
                              <>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label">Meeting Date & Time</label>
                                  <input className="form-input" style={sm} type="datetime-local" value={salesCallForm.meetingScheduledAt} onChange={(e) => setSalesCallForm({ ...salesCallForm, meetingScheduledAt: e.target.value })} />
                                </div>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label">Meeting Type</label>
                                  <select className="form-select" style={sm} value={salesCallForm.meetingType} onChange={(e) => setSalesCallForm({ ...salesCallForm, meetingType: e.target.value })}>
                                    <option value="">Select type</option>
                                    {MEETING_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                </div>
                                <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                                  <label className="form-label">Meeting Location</label>
                                  <input className="form-input" style={sm} value={salesCallForm.meetingLocation} onChange={(e) => setSalesCallForm({ ...salesCallForm, meetingLocation: e.target.value })} />
                                </div>
                              </>
                            )}
                            <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                              <label className="form-label">Call Note</label>
                              <textarea className="form-input" rows={2} maxLength={500} style={{ fontSize: 12, resize: "vertical" }} placeholder="Brief note about the call…" value={salesCallForm.note} onChange={(e) => setSalesCallForm({ ...salesCallForm, note: e.target.value })} />
                            </div>
                            <button className="btn btn-primary" style={{ gridColumn: "span 2", height: 34 }} onClick={handleSalesCallSave}>
                              Log Call
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* sticky footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <button
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => { closeDetail(); openDealModal(selectedDeal); }}
              >
                <Plus size={14} /> Edit / Clone Deal
              </button>
              <button className="btn btn-ghost" onClick={closeDetail}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          ADD DEAL MODAL
      ════════════════════════════════════════ */}
      {showDealModal && (
        <div className="nc-modal-overlay" onClick={() => setShowDealModal(false)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Add New Deal</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowDealModal(false)}><X size={18} /></button>
            </div>
            <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
              {dealSuccess && (
                <div style={{ marginBottom: "var(--space-4)", padding: "10px 14px", background: "var(--color-success-muted,#f0fdf4)", color: "var(--color-success)", borderRadius: 8, fontSize: "var(--text-sm)", fontWeight: 500 }}>
                  {dealSuccess}
                </div>
              )}
              <form id="deal-form-leads" onSubmit={handleAddDeal}>

                <p style={secLabel}>Deal Details</p>
                <div style={{ ...grid2, marginBottom: "var(--space-5)" }}>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Deal Name *</label>
                    <input className="form-input" style={inp} required value={dealForm.name} onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Deal Value (₹)</label>
                    <input className="form-input" style={inp} type="number" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Expected Close Date</label>
                    <input className="form-input" style={inp} type="date" value={dealForm.expectedCloseDate} onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={2} value={dealForm.description} onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })} />
                  </div>
                </div>

                <p style={secLabel}>Client Info</p>
                <div style={{ ...grid2, marginBottom: "var(--space-5)" }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Client Name *</label>
                    <input className="form-input" style={inp} required value={dealForm.clientName} onChange={(e) => setDealForm({ ...dealForm, clientName: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone *</label>
                    <input className="form-input" style={inp} required value={dealForm.clientPhone} onChange={(e) => setDealForm({ ...dealForm, clientPhone: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email</label>
                    <input className="form-input" style={inp} type="email" value={dealForm.clientEmail} onChange={(e) => setDealForm({ ...dealForm, clientEmail: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Company</label>
                    <input className="form-input" style={inp} value={dealForm.companyName} onChange={(e) => setDealForm({ ...dealForm, companyName: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Business URL</label>
                    <input className="form-input" style={inp} value={dealForm.businessUrl} onChange={(e) => setDealForm({ ...dealForm, businessUrl: e.target.value })} />
                  </div>
                </div>

                <p style={secLabel}>Initial Logs (optional)</p>
                <div style={grid2}>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Initial Comment</label>
                    <input className="form-input" style={inp} value={dealForm.initialComment} onChange={(e) => setDealForm({ ...dealForm, initialComment: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Meeting Link</label>
                    <input
                      className="form-input"
                      style={inp}
                      value={dealForm.meetingLink}
                      onChange={(e) => setDealForm({ ...dealForm, meetingLink: e.target.value })}
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Meeting Time</label>
                    <input
                      className="form-input"
                      style={inp}
                      type="datetime-local"
                      value={dealForm.meetingTime}
                      onChange={(e) => setDealForm({ ...dealForm, meetingTime: e.target.value })}
                    />
                  </div>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Meeting Discussion</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={dealForm.meetingDiscussion}
                      onChange={(e) => setDealForm({ ...dealForm, meetingDiscussion: e.target.value })}
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Reminder Date</label>
                    <input
                      className="form-input"
                      style={inp}
                      type="datetime-local"
                      value={dealForm.reminderDate}
                      onChange={(e) => setDealForm({ ...dealForm, reminderDate: e.target.value })}
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Reminder Note</label>
                    <input
                      className="form-input"
                      style={inp}
                      value={dealForm.reminderNote}
                      onChange={(e) => setDealForm({ ...dealForm, reminderNote: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                gap: "var(--space-3)",
                flexShrink: 0,
              }}
            >
              <button
                form="deal-form-leads"
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Create Deal
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowDealModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leads;