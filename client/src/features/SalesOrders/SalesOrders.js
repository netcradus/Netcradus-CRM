import React, { useEffect, useState } from "react";
import { FaShoppingCart, FaEdit, FaTrash } from "react-icons/fa";
import { apiUrl } from "../../config/api";

import "./SalesOrders.css";

const API = apiUrl("/api/salesorders");

function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [newOrder, setNewOrder] = useState({
    orderId: "",
    customer: "",
    amount: "",
    status: "Pending",
    orderedOn: "",
  });

  // ✅ FETCH
  const fetchOrders = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // INPUT
  const handleChange = (e) => {
    setNewOrder({ ...newOrder, [e.target.name]: e.target.value });
  };

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = editId ? "PUT" : "POST";
    const url = editId ? `${API}/${editId}` : API;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder),
    });

    fetchOrders();
    setShowModal(false);
    setEditId(null);
    setNewOrder({
      orderId: "",
      customer: "",
      amount: "",
      status: "Pending",
      orderedOn: "",
    });
  };

  // EDIT
  const handleEdit = (order) => {
    setNewOrder({
      orderId: order.orderId,
      customer: order.customer,
      amount: order.amount,
      status: order.status,
      orderedOn: order.orderedOn?.split("T")[0],
    });
    setEditId(order._id);
    setShowModal(true);
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order?")) return;

    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchOrders();
  };

  return (
    <div className="salesorders-container">
      <h2 className="salesorders-heading">
        <FaShoppingCart /> Sales Orders
      </h2>

      <button className="btn-primary" onClick={() => setShowModal(true)}>
        + Add Order
      </button>

      <div className="salesorders-table">
        <table>
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
  {orders.map((o) => (
    <tr key={o._id}>
      <td data-label="Order ID">{o.orderId}</td>
      <td data-label="Customer">{o.customer}</td>
      <td data-label="Amount">₹ {o.amount}</td>

      <td data-label="Status">
        <span className={`badge ${o.status.toLowerCase()}`}>
          {o.status}
        </span>
      </td>

      <td data-label="Date">
        {new Date(o.orderedOn).toLocaleDateString()}
      </td>

      <td data-label="Actions">
        <FaEdit
          style={{ cursor: "pointer", marginRight: 10 }}
          onClick={() => handleEdit(o)}
        />
        <FaTrash
          style={{ cursor: "pointer", color: "red" }}
          onClick={() => handleDelete(o._id)}
        />
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editId ? "Update Order" : "Create Order"}</h3>

            <form onSubmit={handleSubmit}>
              <input
                name="orderId"
                placeholder="Order ID"
                value={newOrder.orderId}
                onChange={handleChange}
                required
              />
              <input
                name="customer"
                placeholder="Customer"
                value={newOrder.customer}
                onChange={handleChange}
                required
              />
              <input
                name="amount"
                type="number"
                placeholder="Amount"
                value={newOrder.amount}
                onChange={handleChange}
                required
              />

              <select name="status" value={newOrder.status} onChange={handleChange}>
                <option>Pending</option>
                <option>Shipped</option>
                <option>Delivered</option>
              </select>

              <input
                type="date"
                name="orderedOn"
                value={newOrder.orderedOn}
                onChange={handleChange}
                required
              />

              <div className="modal-buttons">
                <button className="btn-primary">
                  {editId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesOrders;