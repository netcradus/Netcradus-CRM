import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Plus, ChevronRight, Package, Edit, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyProduct = { name: "", category: "", description: "", price: "", stock: "", imageUrl: "" };

function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/products"));
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
    };

    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/products/${editingId}`), payload);
      } else {
        await axios.post(apiUrl("/api/products"), payload);
      }
      setForm(emptyProduct);
      setEditingId(null);
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(apiUrl(`/api/products/${id}`));
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Inventory</span><ChevronRight size={10} /><span>Products</span>
          </div>
          <h1 className="title">Product Catalog</h1>
          <p className="subtitle">Manage service offerings and physical product inventory from the live catalog.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyProduct); setShowModal(true); }}><Plus size={16} /> Add Product</button>
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Description</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--color-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={14} color="var(--color-accent)" /></div>
                    <span style={{ fontWeight: "var(--font-semibold)" }}>{product.name}</span>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{product.category}</span></td>
                <td style={{ maxWidth: "280px", whiteSpace: "normal" }}>{product.description || "—"}</td>
                <td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(product.price) || 0)}</td>
                <td>{product.stock || 0}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }} onClick={() => { setEditingId(product._id); setForm({ name: product.name || "", category: product.category || "", description: product.description || "", price: product.price || "", stock: product.stock || "", imageUrl: product.imageUrl || "" }); setShowModal(true); }}><Edit size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-error)" }} onClick={() => handleDelete(product._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No products in catalog.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "500px" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Product" : "New Product"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Product Name</label>
                <input className="form-input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Category</label>
                  <input className="form-input" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Stock</label>
                  <input className="form-input" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Unit Price</label>
                  <input className="form-input" type="number" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
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
