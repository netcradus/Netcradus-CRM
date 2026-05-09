import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, ChevronRight, Edit, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyBook = { name: "", currency: "INR", type: "Retail", products: "", effectiveDate: "", expiryDate: "", status: "Active", version: "v1.0" };

const PriceBooks = () => {
  const [priceBooks, setPriceBooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState(null);

  const fetchPriceBooks = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/pricebooks"));
      setPriceBooks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPriceBooks();
  }, [fetchPriceBooks]);

  const activeCount = useMemo(() => priceBooks.filter((book) => book.status === "Active").length, [priceBooks]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/pricebooks/${editingId}`), form);
      } else {
        await axios.post(apiUrl("/api/pricebooks"), form);
      }
      setForm(emptyBook);
      setEditingId(null);
      setShowModal(false);
      fetchPriceBooks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this price book?")) return;
    try {
      await axios.delete(apiUrl(`/api/pricebooks/${id}`));
      fetchPriceBooks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Inventory</span><ChevronRight size={10} /><span>Price Books</span>
          </div>
          <h1 className="title">Price Books</h1>
          <p className="subtitle">Manage multi-currency pricing models and active price book versions.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyBook); setShowModal(true); }}><Plus size={16} /> New Price Book</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div className="nc-stat-card"><span className="metric-label">Total Books</span><span className="metric-value">{priceBooks.length}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Active Books</span><span className="metric-value" style={{ color: "var(--color-success)" }}>{activeCount}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Currencies</span><span className="metric-value">{new Set(priceBooks.map((book) => book.currency)).size}</span></div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>Name</th><th>Currency</th><th>Type</th><th>Products</th><th>Effective Range</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {priceBooks.map((book) => (
              <tr key={book._id}>
                <td>
                  <div style={{ fontWeight: "var(--font-semibold)" }}>{book.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{book.version}</div>
                </td>
                <td><span className="badge badge-neutral">{book.currency}</span></td>
                <td>{book.type}</td>
                <td style={{ maxWidth: "260px", whiteSpace: "normal" }}>{book.products}</td>
                <td>{book.effectiveDate ? new Date(book.effectiveDate).toLocaleDateString("en-GB") : "—"} to {book.expiryDate ? new Date(book.expiryDate).toLocaleDateString("en-GB") : "—"}</td>
                <td><span className={`badge badge-${book.status === "Active" ? "success" : "ghost"}`}>{book.status}</span></td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }} onClick={() => { setEditingId(book._id); setForm({ ...book, effectiveDate: book.effectiveDate?.substring(0, 10) || "", expiryDate: book.expiryDate?.substring(0, 10) || "" }); setShowModal(true); }}><Edit size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-error)" }} onClick={() => handleDelete(book._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {priceBooks.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No price books defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "520px" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Price Book" : "Add New Price Book"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Price Book Name</label>
                <input className="form-input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Pricing Type</label>
                  <select className="form-select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Products</label>
                <input className="form-input" required value={form.products} onChange={(event) => setForm({ ...form, products: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Effective Date</label>
                  <input className="form-input" type="date" required value={form.effectiveDate} onChange={(event) => setForm({ ...form, effectiveDate: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Expiry Date</label>
                  <input className="form-input" type="date" required value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Version</label>
                  <input className="form-input" required value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Price Book</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceBooks;
