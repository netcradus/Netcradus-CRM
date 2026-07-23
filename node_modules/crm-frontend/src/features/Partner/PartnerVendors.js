import React, { useEffect, useMemo, useState } from "react";
import { Edit, Eye, Plus, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { partnerApi } from "./partnerApi";

const emptyVendor = { name: "", contactPerson: "", email: "", phone: "", country: "", industry: "", address: "", notes: "", status: "Active" };
const countries = ["India", "United States", "United Kingdom", "United Arab Emirates", "Singapore", "Australia", "Canada", "Germany", "Other"];

export default function PartnerVendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyVendor);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadVendors = () => {
    // Vendor reads are partner-scoped on the server.
    partnerApi.vendors().then((res) => setVendors(res.data.vendors || [])).catch(() => setVendors([]));
  };

  useEffect(loadVendors, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return vendors.filter((vendor) => `${vendor.name} ${vendor.contactPerson} ${vendor.email} ${vendor.country}`.toLowerCase().includes(needle));
  }, [search, vendors]);

  const saveVendor = async (event) => {
    event.preventDefault();
    if (editingId) await partnerApi.updateVendor(editingId, form);
    else await partnerApi.createVendor(form);
    setShowModal(false);
    setEditingId(null);
    setForm(emptyVendor);
    loadVendors();
  };

  const toggleVendorStatus = async (vendor) => {
    // Vendor status is intentionally reversible from the action button.
    const nextStatus = vendor.status === "Active" ? "Inactive" : "Active";
    await partnerApi.setVendorStatus(vendor._id, nextStatus);
    loadVendors();
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">My Vendors</h1>
          <p className="subtitle">Companies and contacts linked to your partner account.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setForm(emptyVendor); setEditingId(null); setShowModal(true); }}><Plus size={16} /> Add New Vendor</button>
        </div>
      </div>

      <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div style={{ position: "relative", maxWidth: 340 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search vendors..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead><tr><th>Vendor Name</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>Country</th><th>Status</th><th>Date Added</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((vendor) => (
              <tr key={vendor._id}>
                <td>{vendor.name}</td>
                <td>{vendor.contactPerson || "-"}</td>
                <td>{vendor.email}</td>
                <td>{vendor.phone || "-"}</td>
                <td>{vendor.country || "-"}</td>
                <td><span className={`badge badge-${vendor.status === "Active" ? "success" : "warning"}`}>{vendor.status}</span></td>
                <td>{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString("en-GB") : "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" title="View" onClick={() => { setForm(vendor); setEditingId(vendor._id); setShowModal(true); }}><Eye size={14} /></button>
                    <button className="btn btn-ghost" title="Edit" onClick={() => { setForm(vendor); setEditingId(vendor._id); setShowModal(true); }}><Edit size={14} /></button>
                    <button
                      className="btn btn-ghost"
                      title={vendor.status === "Active" ? "Deactivate" : "Activate"}
                      onClick={() => toggleVendorStatus(vendor)}
                    >
                      {vendor.status === "Active" ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="8" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No vendors found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "min(720px, 94vw)" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Vendor" : "Add New Vendor"}</h3></div>
            <form className="form" onSubmit={saveVendor}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                <label className="form-field"><span className="form-label">Vendor Company Name</span><input className="form-input" required value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">Contact Person Name</span><input className="form-input" required value={form.contactPerson || ""} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">Email Address</span><input className="form-input" type="email" required value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">Phone Number</span><input className="form-input" required value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                <label className="form-field"><span className="form-label">Country</span><select className="form-select" required value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })}><option value="">Select country</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></label>
                <label className="form-field"><span className="form-label">Industry</span><input className="form-input" value={form.industry || ""} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></label>
              </div>
              <label className="form-field"><span className="form-label">Address</span><textarea className="form-input" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
              <label className="form-field"><span className="form-label">Notes</span><textarea className="form-input" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
                <button className="btn btn-primary" type="submit">Save Vendor</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
