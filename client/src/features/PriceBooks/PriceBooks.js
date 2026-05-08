import React, { useState } from "react";
import { BookOpen, Plus, Search, ChevronRight, Coins, Layers, Calendar, Edit, Trash2 } from "lucide-react";

const PriceBooks = () => {
  const [priceBooks, setPriceBooks] = useState([
    { id: 1, name: "Standard Retail", currency: "USD", type: "Retail", products: "Product A, Product B", effectiveDate: "2025-08-01", expiryDate: "2026-01-01", status: "Active", version: "v1.0" },
    { id: 2, name: "Wholesale APAC", currency: "INR", type: "Wholesale", products: "Product C, Product D", effectiveDate: "2025-08-01", expiryDate: "2025-12-31", status: "Inactive", version: "v2.1" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newBook, setNewBook] = useState({ name: "", currency: "INR", type: "Retail", products: "", effectiveDate: "", expiryDate: "", status: "Active", version: "v1.0" });

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this price book?")) {
      setPriceBooks(priceBooks.filter((book) => book.id !== id));
    }
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    setPriceBooks([...priceBooks, { ...newBook, id: Date.now() }]);
    setNewBook({ name: "", currency: "INR", type: "Retail", products: "", effectiveDate: "", expiryDate: "", status: "Active", version: "v1.0" });
    setShowModal(false);
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Inventory</span><ChevronRight size={10} /><span>Price Books</span>
           </div>
           <h1 className="title">Price Books</h1>
           <p className="subtitle">Manage multi-currency pricing models and seasonal price adjustments.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Price Book</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Active Books</span><span className="metric-value">{priceBooks.filter(b => b.status === 'Active').length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Expiring Soon</span><span className="metric-value" style={{ color: 'var(--color-warning)' }}>0</span></div>
         <div className="nc-stat-card"><span className="metric-label">Currencies</span><span className="metric-value" style={{ color: 'var(--color-accent)' }}>{new Set(priceBooks.map(b => b.currency)).size}</span></div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Name</th><th>Currency</th><th>Type</th><th>Effective Range</th><th>Status</th><th>Version</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {priceBooks.map((book) => (
                 <tr key={book.id}>
                    <td>
                       <div style={{ fontWeight: 'var(--font-semibold)' }}>{book.name}</div>
                       <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{book.products}</div>
                    </td>
                    <td><span className="badge badge-neutral">{book.currency}</span></td>
                    <td>{book.type}</td>
                    <td>
                       <div style={{ fontSize: 'var(--text-sm)' }}>{formatDate(book.effectiveDate)} — {formatDate(book.expiryDate)}</div>
                    </td>
                    <td><span className={`badge badge-${book.status?.toLowerCase() === 'active' ? 'success' : 'ghost'}`}>{book.status}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{book.version}</span></td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}><Edit size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={() => handleDelete(book.id)}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {priceBooks.length === 0 && (
                 <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No price books defined.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header"><h3>Add New Price Book</h3></div>
              <form className="form" onSubmit={handleAddBook}>
                 <div className="form-field">
                    <label className="form-label">Price Book Name</label>
                    <input className="form-input" required value={newBook.name} onChange={e => setNewBook({...newBook, name: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Currency</label>
                       <select className="form-select" value={newBook.currency} onChange={e => setNewBook({...newBook, currency: e.target.value})}>
                          <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
                       </select>
                    </div>
                    <div className="form-field">
                       <label className="form-label">Pricing Type</label>
                       <select className="form-select" value={newBook.type} onChange={e => setNewBook({...newBook, type: e.target.value})}>
                          <option>Retail</option><option>Wholesale</option><option>Seasonal</option>
                       </select>
                    </div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Effective Date</label>
                       <input className="form-input" type="date" required value={newBook.effectiveDate} onChange={e => setNewBook({...newBook, effectiveDate: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Expiry Date</label>
                       <input className="form-input" type="date" required value={newBook.expiryDate} onChange={e => setNewBook({...newBook, expiryDate: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
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
