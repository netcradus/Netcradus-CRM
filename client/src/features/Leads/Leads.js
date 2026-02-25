import React, { useEffect, useState } from "react";
import "./Leads.css";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { FaClipboardList } from "react-icons/fa";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [users, setUsers] = useState([]);

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
    status: "Cold",
    notes: "",
    assignedTo: ""
  });

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const LEAD_STATUSES = ["Hot", "Warm", "Cold"];

  // Fetch leads
  useEffect(() => {
    fetchLeads();
    if (userRole === "admin") {
      fetchUsers();
    }
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl("/api/leads"));
      setLeads(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err.response?.data?.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(apiUrl("/api/auth/users"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Users fetched:", response.data);
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users for assignment");
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.phone && lead.phone.includes(search)) ||
      (lead.company && lead.company.toLowerCase().includes(search.toLowerCase()))
  );

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
      status: "Cold",
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
      status: lead.status || "Cold",
      notes: lead.notes || "",
      assignedTo: lead.assignedTo?._id || ""
    });
    setShowModal(true);
  };

  // Submit form (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }

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
      setLoading(true);
      setShowMappingModal(false);

      const validData = dataToImport.filter(row => row[mapping.name] && row[mapping.email]);

      if (validData.length === 0) {
        setError("No valid data found to import (Name and Email are required).");
        setLoading(false);
        return;
      }

      for (const row of validData) {
        await axios.post(apiUrl("/api/leads"), {
          name: row[mapping.name],
          email: row[mapping.email],
          phone: mapping.phone ? row[mapping.phone] : "",
          company: mapping.company ? row[mapping.company] : "",
          status: row["Status"] || row["status"] || "Cold",
          assignedTo: "",
          notes: row["Notes"] || row["notes"] || ""
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchLeads();
      setSuccess("CSV imported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error importing CSV:", err);
      setError(err.response?.data?.message || "Failed to import CSV");
    } finally {
      setLoading(false);
    }
  };

  // Import CSV
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
      const headers = headerLine.split(",").map(h => h.trim().replace(/^"|"$/g, ''));

      setCsvHeaders(headers);

      const parsedData = lines.map(line => {
        // Simple split handling, ignores commas inside quotes for simplicity (assuming basic CSV)
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ''));
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
          name: headers[lowercaseHeaders.indexOf('name')] || "",
          email: headers[lowercaseHeaders.indexOf('email')] || "",
          phone: headers[lowercaseHeaders.indexOf('phone')] || "",
          company: headers[lowercaseHeaders.indexOf('company')] || ""
        });
        setShowMappingModal(true);
      }
      e.target.value = null; // Reset input
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="leads-container">
        <h3>Loading Leads...</h3>
      </div>
    );
  }

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
            accept=".csv"
            onChange={handleImportCSV}
            style={{ display: "none" }}
            id="import-csv-input"
          />
          <label htmlFor="import-csv-input" className="btn-csv">📥 Import CSV</label>
        </div>
      </div>

      {/* Actions */}
      <div className="leads-actions">
        <button className="btn-primary" onClick={handleAddLead}>
          ➕ Add New Lead
        </button>
        <input
          className="search-bar"
          type="text"
          placeholder="Search by name, email, phone, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status Legend */}
      <div className="lead-status">
        <div className="status-item hot">🔥 Hot</div>
        <div className="status-item warm">🌤 Warm</div>
        <div className="status-item cold">❄️ Cold</div>
      </div>

      {/* Leads Table */}
      <div className="leads-table">
        {filteredLeads.length > 0 ? (
          <table>
            <thead>
              <tr>
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
              {filteredLeads.map((lead, index) => (
                <tr key={lead._id}>
                  <td>{index + 1}</td>
                  <td className="lead-name">{lead.name}</td>
                  <td className="lead-email">{lead.email}</td>
                  <td>{lead.phone || "-"}</td>
                  <td>{lead.company || "-"}</td>
                  <td>
                    <span className={`badge ${lead.status.toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{lead.assignedTo?.name || "-"}</td>
                  <td>{lead.createdBy?.name || "Unknown"}</td>
                  <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditLead(lead)}
                      title="Edit lead"
                    >
                      ✏️ Edit
                    </button>
                    {userRole === "admin" && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteLead(lead._id)}
                        title="Delete lead"
                      >
                        🗑 Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-leads">
            <p>No leads found 😢</p>
          </div>
        )}
      </div>

      {/* Modal */}
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
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter lead name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email"
                    required
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
                <label>Name *</label>
                <select
                  value={columnMapping.name}
                  onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Select Column --</option>
                  {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Email *</label>
                <select
                  value={columnMapping.email}
                  onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Select Column --</option>
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
                  disabled={!columnMapping.name || !columnMapping.email}
                  onClick={() => processImportData(csvData, columnMapping)}
                  style={{ opacity: (!columnMapping.name || !columnMapping.email) ? 0.5 : 1 }}
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
