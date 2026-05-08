import React, { useState } from "react";
import { PackageCheck, Plus, Search, ChevronRight, Truck, Trash2, Eye } from "lucide-react";

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: "", vendor: "", amount: "", status: "pending", date: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setOrders([...orders, form]);
    setForm({ id: "", vendor: "", amount: "", status: "pending", date: "" });
    setShowModal(false);
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Inventory</span><ChevronRight size={10} /><span>Purchase Orders</span>
           </div>
           <h1 className="title">Purchase Orders</h1>
           <p className="subtitle">Track procurement and vendor supply orders.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New PO</button>
        </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Order ID</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {orders.map((o, i) => (
                 <tr key={i}>
                    <td><span style={{ fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{o.id}</span></td>
                    <td style={{ fontWeight: 'var(--font-semibold)' }}>{o.vendor}</td>
                    <td>₹ {Number(o.amount).toLocaleString()}</td>
                    <td><span className={`badge badge-${o.status === 'completed' ? 'success' : o.status === 'cancelled' ? 'error' : 'warning'}`}>{o.status}</span></td>
                    <td>{o.date}</td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}><Eye size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={() => setOrders(orders.filter(ord => ord.id !== o.id))}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {orders.length === 0 && (
                 <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No purchase orders found.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>New Purchase Order</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Order ID</label>
                    <input className="form-input" required name="id" value={form.id} onChange={e => setForm({...form, id: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Vendor Name</label>
                    <input className="form-input" required name="vendor" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Total Amount (₹)</label>
                    <input className="form-input" type="number" required name="amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Order Date</label>
                    <input className="form-input" type="date" required name="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save PO</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
