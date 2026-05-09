import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Store, Plus, Search, ChevronRight, Trash2, Edit } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyVendor = { name: "", email: "", category: "Supplier", status: "Active", lastInteraction: "" };

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyVendor);
  const [editingId, setEditingId] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/vendors"));
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = useMemo(() => {
    const needle = search.toLowerCase();
    return vendors.filter((vendor) => `${vendor.name} ${vendor.email} ${vendor.category}`.toLowerCase().includes(needle));
  }, [search, vendors]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/vendors/${editingId}`), form);
      } else {
        await axios.post(apiUrl("/api/vendors"), form);
      }
      setForm(emptyVendor);
      setEditingId(null);
      setShowModal(false);
      fetchVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await axios.delete(apiUrl(`/api/vendors/${id}`));
      fetchVendors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Inventory</span><ChevronRight size={10} /><span>Vendors</span>
          </div>
          <h1 className="title">Vendor Management</h1>
          <p className="subtitle">Maintain suppliers and partner records from the live vendor directory.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyVendor); setShowModal(true); }}><Plus size={16} /> Add Vendor</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ position: "relative", maxWidth: "320px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: "36px" }} placeholder="Search vendors..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>Vendor Name</th><th>Contact Email</th><th>Category</th><th>Status</th><th>Last Interaction</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredVendors.map((vendor) => (
              <tr key={vendor._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--color-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}><Store size={14} color="var(--color-accent)" /></div>
                    <span style={{ fontWeight: "var(--font-semibold)" }}>{vendor.name}</span>
                  </div>
                </td>
                <td>{vendor.email}</td>
                <td><span className="badge badge-neutral">{vendor.category}</span></td>
                <td><span className={`badge badge-${vendor.status === "Active" ? "success" : "warning"}`}>{vendor.status}</span></td>
                <td>{vendor.lastInteraction ? new Date(vendor.lastInteraction).toLocaleDateString("en-GB") : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }} onClick={() => { setEditingId(vendor._id); setForm({ ...vendor, lastInteraction: vendor.lastInteraction?.substring(0, 10) || "" }); setShowModal(true); }}><Edit size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-error)" }} onClick={() => handleDelete(vendor._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredVendors.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No vendors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "420px" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Vendor" : "Add New Vendor"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Vendor Name</label>
                <input className="form-input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    <option value="Supplier">Supplier</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Last Interaction</label>
                <input className="form-input" type="date" value={form.lastInteraction} onChange={(event) => setForm({ ...form, lastInteraction: event.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Vendor</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendors;
