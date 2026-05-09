import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, X, ChevronRight } from "lucide-react";
import { apiUrl } from "../../config/api";

const SECTION_CONFIG = {
  "/management/business/clients": {
    title: "Client Information",
    breadcrumb: "Management / Business / Client Information",
    endpoint: "/api/management/business/clients",
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
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
  }
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime()) && String(value).length >= 8) return asDate.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
  return value;
};

function ManagementHub() {
  const location = useLocation();
  const config = SECTION_CONFIG[location.pathname];
  const [rows, setRows] = useState([]);
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const loadData = useCallback(async (query = "") => {
    if (!config) return;
    setLoading(true);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const response = await fetch(apiUrl(`${config.endpoint}${params}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      setRows(data.rows || []);
      setCards(data.cards || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    setForm(config.fields.reduce((acc, f) => ({ ...acc, [f.key]: f.type === 'select' ? f.options[0] : '' }), {}));
    loadData();
  }, [config, loadData]);

  useEffect(() => {
    if (!config) return;
    const timer = window.setTimeout(() => {
      loadData(search);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [config, loadData, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editing ? `${config.endpoint}/${editing._id}` : config.endpoint;
    const method = editing ? "PUT" : "POST";
    try {
      await fetch(apiUrl(endpoint), {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(form),
      });
      setShowModal(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  if (!config) return <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>Module configuration not found.</div>;

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Management</span><ChevronRight size={10} /><span>{config.title}</span>
           </div>
           <h1 className="title">{config.title}</h1>
           <p className="subtitle">Track and manage business operations for {config.title.toLowerCase()}.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}><Plus size={16} /> Add Record</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
         {cards.map((c, i) => (
           <div key={i} className="nc-stat-card">
              <span className="metric-label">{c.label}</span>
              <span className="metric-value">{c.currency ? formatValue(c.value, 'currency') : c.value}</span>
           </div>
         ))}
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px', maxWidth: '400px' }} placeholder="Filter records..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="nc-card" style={{ padding: 0, overflow: 'hidden' }}>
         <div style={{ overflowX: 'auto' }}>
         <table className="nc-table">
            <thead>
               <tr>
                  {config.columns.map(c => <th key={c.key}>{c.label}</th>)}
                  <th>Actions</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan={config.columns.length + 1} style={{ textAlign: 'center', padding: 'var(--space-10)' }}>Loading...</td></tr>
               ) : rows.length === 0 ? (
                 <tr><td colSpan={config.columns.length + 1} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No records found.</td></tr>
               ) : rows.map(r => (
                 <tr key={r._id}>
                    {config.columns.map(c => (
                      <td key={c.key}>
                         <span className={`badge ${String(r[c.key]).toLowerCase() === 'active' || String(r[c.key]).toLowerCase() === 'won' ? 'badge-success' : ''}`}>
                            {formatValue(r[c.key], c.format)}
                         </span>
                      </td>
                    ))}
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" onClick={() => { setEditing(r); setForm(r); setShowModal(true); }}><Pencil size={14} /></button>
                          <button className="btn btn-ghost btn-danger" onClick={async () => { if(window.confirm('Delete?')) { await fetch(apiUrl(`${config.endpoint}/${r._id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }); loadData(); } }}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
         </div>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header"><h3>{editing ? "Edit Record" : "Add New Record"}</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 {config.fields.map(f => (
                   <div key={f.key} className="form-field">
                      <label className="form-label">{f.label}</label>
                      {f.type === 'select' ? (
                        <select className="form-select" value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}>
                           {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea className="form-input" rows={2} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                      ) : (
                        <input className="form-input" type={f.type} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                      )}
                   </div>
                 ))}
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Record</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default ManagementHub;
