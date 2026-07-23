import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ShoppingCart, Edit, Trash2, Plus, Search, ChevronRight } from "lucide-react";
import { apiUrl } from "../../config/api";

const API = apiUrl("/api/salesorders");
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

const STATUS_OPTIONS = ["Pending", "Shipped", "Delivered"];

function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [newOrder, setNewOrder] = useState({ orderId: "", customer: "", amount: "", status: "Pending", orderedOn: "" });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API, getHeaders());
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, { ...newOrder, amount: Number(newOrder.amount) }, getHeaders());
      } else {
        await axios.post(API, { ...newOrder, amount: Number(newOrder.amount) }, getHeaders());
      }
      fetchOrders();
      setShowModal(false);
    } catch (err) { alert("Save failed"); }
    finally { setSubmitting(false); }
  };

  const filtered = orders.filter(o => (o.customer || "").toLowerCase().includes(search.toLowerCase()) || (o.orderId || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Sales</span><ChevronRight size={10} /><span>Orders</span>
           </div>
           <h1 className="title">Sales Orders</h1>
           <p className="subtitle">Track client orders and shipment statuses.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => { setEditId(null); setNewOrder({ orderId: "", customer: "", amount: "", status: "Pending", orderedOn: "" }); setShowModal(true); }}><Plus size={16} /> New Order</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
         <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search order ID or customer..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
               </tr>
            </thead>
            <tbody>
               {filtered.map(o => (
                 <tr key={o._id}>
                    <td><span style={{ fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{o.orderId}</span></td>
                    <td style={{ fontWeight: 'var(--font-semibold)' }}>{o.customer}</td>
                    <td>₹ {Number(o.amount || 0).toLocaleString("en-IN")}</td>
                    <td><span className={`badge badge-${o.status?.toLowerCase() === 'delivered' ? 'success' : o.status?.toLowerCase() === 'cancelled' ? 'error' : 'warning'}`}>{o.status}</span></td>
                    <td>{o.orderedOn ? new Date(o.orderedOn).toLocaleDateString("en-GB") : "—"}</td>
                    <td>
                       <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => { setEditId(o._id); setNewOrder({ orderId: o.orderId, customer: o.customer, amount: o.amount, status: o.status || "Pending", orderedOn: o.orderedOn?.substring(0, 10) }); setShowModal(true); }}><Edit size={14} /></button>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={async () => { if(window.confirm('Delete?')) { await axios.delete(`${API}/${o._id}`, getHeaders()); fetchOrders(); } }}><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {filtered.length === 0 && !loading && (
                 <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No orders found.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>{editId ? "Edit Order" : "New Order"}</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Order ID</label>
                    <input className="form-input" required name="orderId" value={newOrder.orderId} onChange={e => setNewOrder({...newOrder, orderId: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Customer Name</label>
                    <input className="form-input" required name="customer" value={newOrder.customer} onChange={e => setNewOrder({...newOrder, customer: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Amount (₹)</label>
                    <input className="form-input" type="number" required name="amount" value={newOrder.amount} onChange={e => setNewOrder({...newOrder, amount: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={newOrder.status} onChange={e => setNewOrder({...newOrder, status: e.target.value})}>
                       {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" required name="orderedOn" value={newOrder.orderedOn} onChange={e => setNewOrder({...newOrder, orderedOn: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Saving...' : 'Save Order'}</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default SalesOrders;
