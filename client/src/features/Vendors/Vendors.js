import React, { useState } from "react";
import { Store, Plus, Search, ChevronRight, User, Mail, Calendar } from "lucide-react";

function Vendors() {
  const [showModal, setShowModal] = useState(false);
  const [vendors, setVendors] = useState([{ name: "ABC Suppliers", email: "abc@email.com", category: "Supplier", status: "Active", lastInteraction: "2026-03-02" }]);
  const [form, setForm] = useState({ name: "", email: "", category: "Supplier", status: "Active", lastInteraction: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setVendors([...vendors, form]);
    setForm({ name: "", email: "", category: "Supplier", status: "Active", lastInteraction: "" });
    setShowModal(false);
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Inventory</span><ChevronRight size={10} /><span>Vendors</span>
           </div>
           <h1 className="title">Vendor Management</h1>
           <p className="subtitle">Maintain records of your suppliers, partners and external service providers.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Vendor</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ position: 'relative', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search vendors..." />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Vendor Name</th><th>Contact Email</th><th>Category</th><th>Status</th><th>Last Interaction</th></tr>
            </thead>
            <tbody>
               {vendors.map((v, i) => (
                 <tr key={i}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={14} color="var(--color-accent)" /></div>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{v.name}</span>
                       </div>
                    </td>
                    <td>{v.email}</td>
                    <td><span className="badge badge-neutral">{v.category}</span></td>
                    <td><span className={`badge badge-${v.status?.toLowerCase() === 'active' ? 'success' : 'warning'}`}>{v.status}</span></td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{v.lastInteraction}</td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>Add New Vendor</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Vendor Name</label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Category</label>
                       <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                          <option>Supplier</option>
                          <option>Partner</option>
                          <option>Contractor</option>
                       </select>
                    </div>
                    <div className="form-field">
                       <label className="form-label">Last Interaction</label>
                       <input className="form-input" type="date" value={form.lastInteraction} onChange={e => setForm({...form, lastInteraction: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
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
