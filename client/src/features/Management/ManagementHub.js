import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "../../config/api";
import "./ManagementHub.css";

const SECTION_CONFIG = {
  "/management/business/clients": {
    title: "Client Information",
    breadcrumb: "Management / Business / Client Information",
    endpoint: "/api/management/business/clients",
    createEndpoint: "/api/management/business/clients",
    updateEndpoint: (id) => `/api/management/business/clients/${id}`,
    deleteEndpoint: (id) => `/api/management/business/clients/${id}`,
    fields: [
      { key: "companyName", label: "Company Name", type: "text", required: true },
      { key: "contactPerson", label: "Contact Person", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Prospect", "On Hold", "Archived"] },
      { key: "segment", label: "Segment", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "companyName", label: "Company" },
      { key: "contactPerson", label: "Contact" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
      { key: "segment", label: "Segment" },
    ],
  },
  "/management/business/tenders": {
    title: "Tender",
    breadcrumb: "Management / Business / Tender Related",
    endpoint: "/api/management/business/tenders",
    createEndpoint: "/api/management/business/tenders",
    updateEndpoint: (id) => `/api/management/business/tenders/${id}`,
    deleteEndpoint: (id) => `/api/management/business/tenders/${id}`,
    fields: [
      { key: "tenderName", label: "Tender Name", type: "text", required: true },
      { key: "clientName", label: "Client Name", type: "text" },
      { key: "bidValue", label: "Bid Value", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Open", "Submitted", "Won", "Lost", "In Review"] },
      { key: "submissionDate", label: "Submission Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "tenderName", label: "Tender" },
      { key: "clientName", label: "Client" },
      { key: "bidValue", label: "Bid Value", format: "currency" },
      { key: "status", label: "Status" },
      { key: "submissionDate", label: "Submission" },
    ],
  },
  "/management/business/overview": {
    title: "Other Business",
    breadcrumb: "Management / Business / Other Business Related",
    endpoint: "/api/management/business/overview",
    createEndpoint: "/api/management/business/overview",
    updateEndpoint: (id) => `/api/management/business/overview/${id}`,
    deleteEndpoint: (id) => `/api/management/business/overview/${id}`,
    fields: [
      { key: "reportTitle", label: "Report Title", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: ["Overview", "Analytics", "Performance", "Report"] },
      { key: "metricValue", label: "Metric Value", type: "number" },
      { key: "status", label: "Health", type: "select", options: ["Healthy", "Watch", "Critical"] },
      { key: "summary", label: "Summary", type: "textarea" },
    ],
    columns: [
      { key: "reportTitle", label: "Title" },
      { key: "category", label: "Category" },
      { key: "metricValue", label: "Metric" },
      { key: "status", label: "Status" },
      { key: "updatedAt", label: "Updated" },
    ],
  },
  "/management/day-to-day/purchases": {
    title: "Purchases Done",
    breadcrumb: "Management / Day to Day / Purchases Done",
    endpoint: "/api/management/day-to-day/purchases",
    createEndpoint: "/api/management/day-to-day/purchases",
    updateEndpoint: (id) => `/api/management/day-to-day/purchases/${id}`,
    deleteEndpoint: (id) => `/api/management/day-to-day/purchases/${id}`,
    fields: [
      { key: "itemName", label: "Item Name", type: "text", required: true },
      { key: "vendorName", label: "Vendor", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
      { key: "purchaseDate", label: "Purchase Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Completed", "Processing", "Cancelled"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "itemName", label: "Item" },
      { key: "vendorName", label: "Vendor" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "status", label: "Status" },
      { key: "purchaseDate", label: "Date" },
    ],
  },
  "/management/day-to-day/purchase-items": {
    title: "Items to Purchase",
    breadcrumb: "Management / Day to Day / Items to Purchase",
    endpoint: "/api/management/day-to-day/purchase-items",
    createEndpoint: "/api/management/day-to-day/purchase-items",
    updateEndpoint: (id) => `/api/management/day-to-day/purchase-items/${id}`,
    deleteEndpoint: (id) => `/api/management/day-to-day/purchase-items/${id}`,
    fields: [
      { key: "itemName", label: "Item Name", type: "text", required: true },
      { key: "vendorName", label: "Preferred Vendor", type: "text" },
      { key: "expectedDeliveryDate", label: "Expected Delivery", type: "date" },
      { key: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Urgent"] },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Ordered", "Received"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "itemName", label: "Item" },
      { key: "vendorName", label: "Vendor" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "expectedDeliveryDate", label: "Expected Delivery" },
    ],
  },
  "/management/day-to-day/invoices": {
    title: "Invoices",
    breadcrumb: "Management / Day to Day / Invoice Related",
    endpoint: "/api/management/day-to-day/invoices",
    createEndpoint: "/api/management/day-to-day/invoices",
    updateEndpoint: (id) => `/api/management/day-to-day/invoices/${id}`,
    deleteEndpoint: (id) => `/api/management/day-to-day/invoices/${id}`,
    fields: [
      { key: "invoiceNumber", label: "Invoice Number", type: "text", required: true },
      { key: "clientName", label: "Client Name", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Paid", "Overdue"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "invoiceNumber", label: "Invoice" },
      { key: "clientName", label: "Client" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "status", label: "Status" },
      { key: "dueDate", label: "Due Date" },
    ],
  },
};

const formatValue = (value, format) => {
  if (!value) return "N/A";
  if (format === "currency") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime()) && String(value).length >= 8) return asDate.toLocaleDateString();
  return value;
};

const emptyFormFromFields = (fields) =>
  fields.reduce((acc, field) => {
    acc[field.key] = field.type === "select" ? field.options[0] : "";
    return acc;
  }, {});

function ManagementHub() {
  const location = useLocation();
  const config = SECTION_CONFIG[location.pathname];
  const [rows, setRows] = useState([]);
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyFormFromFields(config?.fields || []));

  const loadData = useCallback(async (query = "") => {
    if (!config) return;
    setLoading(true);
    setError("");
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const response = await fetch(apiUrl(`${config.endpoint}${params}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to load data.");
      setRows(payload.rows || []);
      setCards(payload.cards || []);
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    setForm(emptyFormFromFields(config.fields));
    setEditing(null);
    loadData();
  }, [config, loadData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData(search);
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, loadData]);

  const formTitle = useMemo(() => (editing ? `Edit ${config.title}` : `Add ${config.title}`), [config, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyFormFromFields(config.fields));
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(
      config.fields.reduce((acc, field) => {
        const value = row[field.key];
        if (field.type === "date" && value) {
          acc[field.key] = new Date(value).toISOString().split("T")[0];
        } else {
          acc[field.key] = value ?? (field.type === "select" ? field.options[0] : "");
        }
        return acc;
      }, {})
    );
    setShowModal(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      const endpoint = editing ? config.updateEndpoint(editing._id) : config.createEndpoint;
      const method = editing ? "PUT" : "POST";
      const response = await fetch(apiUrl(endpoint), {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to save record.");
      setShowModal(false);
      setEditing(null);
      setForm(emptyFormFromFields(config.fields));
      loadData(search);
    } catch (submitError) {
      setError(submitError.message || "Unable to save record.");
    }
  };

  const removeRow = async (row) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const response = await fetch(apiUrl(config.deleteEndpoint(row._id)), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to delete record.");
      loadData(search);
    } catch (removeError) {
      setError(removeError.message || "Unable to delete record.");
    }
  };

  if (!config) return <div className="management-hub">Management page not found.</div>;

  return (
    <section className="management-hub">
      <div className="management-hero">
        <div>
          <p className="management-breadcrumb">{config.breadcrumb}</p>
          <h1>{config.title}</h1>
          <p>Dedicated management workspace with separate data, role checks, and clean responsive UI.</p>
        </div>
        <button className="management-primary-btn" onClick={openCreate}>Add New</button>
      </div>

      <div className="management-toolbar">
        <input
          type="search"
          placeholder="Search records..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <div className="management-alert">{error}</div>}

      <div className="management-cards">
        {cards.map((card, index) => (
          <article key={`${card.label}-${index}`} className="management-card">
            <span>{card.label}</span>
            <strong>{card.currency ? formatValue(card.value, "currency") : Number(card.value || 0).toLocaleString()}</strong>
          </article>
        ))}
      </div>

      <div className="management-data-shell">
        {loading ? (
          <div className="management-state">Loading...</div>
        ) : (
          <>
            <table className="management-table">
              <thead>
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="management-state">No records found.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id}>
                      {config.columns.map((column) => (
                        <td key={`${row._id}-${column.key}`}>
                          <span className={`management-pill ${String(row[column.key] || "").toLowerCase()}`}>
                            {formatValue(row[column.key], column.format)}
                          </span>
                        </td>
                      ))}
                      <td>
                        <div className="management-row-actions">
                          <button type="button" className="management-ghost-btn" onClick={() => openEdit(row)}>Edit</button>
                          <button type="button" className="management-danger-btn" onClick={() => removeRow(row)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="management-mobile-list">
              {rows.map((row) => (
                <article key={row._id} className="management-mobile-card">
                  {config.columns.map((column) => (
                    <div key={`${row._id}-${column.key}`} className="management-mobile-line">
                      <span>{column.label}</span>
                      <strong>{formatValue(row[column.key], column.format)}</strong>
                    </div>
                  ))}
                  <div className="management-row-actions">
                    <button type="button" className="management-ghost-btn" onClick={() => openEdit(row)}>Edit</button>
                    <button type="button" className="management-danger-btn" onClick={() => removeRow(row)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="management-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="management-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{formTitle}</h3>
            <form className="management-form" onSubmit={submitForm}>
              {config.fields.map((field) => (
                <label key={field.key} className={field.type === "textarea" ? "management-field management-field-wide" : "management-field"}>
                  <span>{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      value={form[field.key] || ""}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={form[field.key] || ""}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.key] || ""}
                      required={field.required}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
              <div className="management-modal-actions">
                <button type="button" className="management-ghost-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="management-primary-btn">{editing ? "Save Changes" : "Create Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default ManagementHub;
