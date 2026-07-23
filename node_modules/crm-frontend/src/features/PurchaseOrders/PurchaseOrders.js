import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, ChevronRight, Trash2, Edit } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyOrder = {
  poNumber: "",
  contact: "",
  productId: "",
  quantity: 1,
  price: "",
  status: "Pending",
  orderDate: "",
  deliveryDate: "",
};

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyOrder);
  const [editingId, setEditingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, contactsRes, productsRes] = await Promise.all([
        axios.get(apiUrl("/api/purchase-orders")),
        axios.get(apiUrl("/api/contacts"), authHeaders()),
        axios.get(apiUrl("/api/products")),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const contactsById = useMemo(
    () => Object.fromEntries(contacts.map((contact) => [contact._id, contact])),
    [contacts]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      poNumber: form.poNumber,
      contact: form.contact,
      products: [
        {
          productId: form.productId,
          quantity: Number(form.quantity) || 1,
          price: Number(form.price) || 0,
        },
      ],
      totalAmount: (Number(form.quantity) || 1) * (Number(form.price) || 0),
      status: form.status,
      orderDate: form.orderDate,
      deliveryDate: form.deliveryDate || undefined,
    };

    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/purchase-orders/${editingId}`), payload);
      } else {
        await axios.post(apiUrl("/api/purchase-orders"), payload);
      }
      setForm(emptyOrder);
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this purchase order?")) return;
    try {
      await axios.delete(apiUrl(`/api/purchase-orders/${id}`));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Inventory</span><ChevronRight size={10} /><span>Purchase Orders</span>
          </div>
          <h1 className="title">Purchase Orders</h1>
          <p className="subtitle">Track procurement records using the actual purchase order schema.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyOrder); setShowModal(true); }}><Plus size={16} /> New PO</button>
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>PO Number</th><th>Vendor Contact</th><th>Product</th><th>Quantity</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const firstLine = order.products?.[0];
              const linkedContact = contactsById[order.contact] || null;
              return (
                <tr key={order._id}>
                  <td><span style={{ fontWeight: "var(--font-bold)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{order.poNumber}</span></td>
                  <td>{linkedContact?.name || linkedContact?.email || order.contact || "—"}</td>
                  <td>{firstLine?.productId?.name || "—"}</td>
                  <td>{firstLine?.quantity || 0}</td>
                  <td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(order.totalAmount) || 0)}</td>
                  <td><span className={`badge badge-${order.status === "Approved" ? "success" : order.status === "Rejected" ? "error" : "warning"}`}>{order.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }} onClick={() => {
                        setEditingId(order._id);
                        setForm({
                          poNumber: order.poNumber || "",
                          contact: order.contact || "",
                          productId: firstLine?.productId?._id || firstLine?.productId || "",
                          quantity: firstLine?.quantity || 1,
                          price: firstLine?.price || "",
                          status: order.status || "Pending",
                          orderDate: order.orderDate?.substring(0, 10) || "",
                          deliveryDate: order.deliveryDate?.substring(0, 10) || "",
                        });
                        setShowModal(true);
                      }}><Edit size={14} /></button>
                      <button className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-error)" }} onClick={() => handleDelete(order._id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No purchase orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "520px" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Purchase Order" : "New Purchase Order"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">PO Number</label>
                <input className="form-input" required value={form.poNumber} onChange={(event) => setForm({ ...form, poNumber: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Vendor Contact</label>
                  <select className="form-select" required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })}>
                    <option value="">Select contact</option>
                    {contacts.map((contact) => (
                      <option key={contact._id} value={contact._id}>{contact.name} ({contact.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Product</label>
                  <select className="form-select" required value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" min="1" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Unit Price</label>
                  <input className="form-input" type="number" min="0" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Order Date</label>
                  <input className="form-input" type="date" required value={form.orderDate} onChange={(event) => setForm({ ...form, orderDate: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Delivery Date</label>
                  <input className="form-input" type="date" value={form.deliveryDate} onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
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
