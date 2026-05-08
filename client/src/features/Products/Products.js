import React, { useState } from "react";
import { Box, Plus, Search, ChevronRight, BarChart3, Package, Layers } from "lucide-react";

function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "", currency: "INR", tax: "", discount: "", status: "Active", stock: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setProducts([...products, { ...form, updated: new Date().toISOString() }]);
    setShowModal(false);
    setForm({ name: "", category: "", price: "", currency: "INR", tax: "", discount: "", status: "Active", stock: "" });
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Inventory</span><ChevronRight size={10} /><span>Products</span>
           </div>
           <h1 className="title">Product Catalog</h1>
           <p className="subtitle">Manage your service offerings and physical product inventory.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Product</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Total SKUs</span><span className="metric-value">{products.length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">In Stock</span><span className="metric-value">{products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Categories</span><span className="metric-value">{new Set(products.map(p => p.category)).size}</span></div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Product</th><th>Category</th><th>Price</th><th>Tax / Disc.</th><th>Stock</th><th>Status</th></tr>
            </thead>
            <tbody>
               {products.map((p, i) => (
                 <tr key={i}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={14} color="var(--color-accent)" /></div>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{p.name}</span>
                       </div>
                    </td>
                    <td><span className="badge badge-neutral">{p.category}</span></td>
                    <td style={{ fontWeight: 'var(--font-bold)' }}>{p.currency} {Number(p.price).toLocaleString()}</td>
                    <td>
                       <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          Tax: {p.tax || 0}% • Disc: {p.discount || 0}%
                       </div>
                    </td>
                    <td>{p.stock || "—"}</td>
                    <td><span className={`badge badge-${p.status?.toLowerCase() === 'active' ? 'success' : 'warning'}`}>{p.status}</span></td>
                 </tr>
               ))}
               {products.length === 0 && (
                 <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No products in catalog.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header"><h3>New Product</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Product Name</label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Category</label>
                       <input className="form-input" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Stock / Quantity</label>
                       <input className="form-input" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Unit Price</label>
                       <input className="form-input" type="number" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Currency</label>
                       <select className="form-select" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                          <option>INR</option>
                          <option>USD</option>
                       </select>
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Product</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default Products;
