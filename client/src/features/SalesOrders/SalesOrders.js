 import React, { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import "./SalesOrders.css";

function SalesOrders() {
  const [orders, setOrders] = useState([
   
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const [newOrder, setNewOrder] = useState({
    id: "",
    customer: "",
    amount: "",
    status: "Pending",
    date: "",
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    setNewOrder({ ...newOrder, [e.target.name]: e.target.value });
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    setOrders([...orders, newOrder]);
    setNewOrder({ id: "", customer: "", amount: "", status: "Pending", date: "" });
    setShowModal(false);
  };

  return (
    <div className="salesorders-container">
      <h2 className="salesorders-heading"><FaShoppingCart /> Sales Orders</h2>

      <div className="salesorders-actions">
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create Order
        </button>
        <input
          className="search-bar"
          type="text"
          placeholder="Search Orders"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="order-status">
        {["All", "Pending", "Shipped", "Delivered"].map((status) => (
          <div
            key={status}
            className={`tag ${status.toLowerCase()} ${filterStatus === status ? "active" : ""}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </div>
        ))}
      </div>

      <div className="salesorders-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Ordered On</th>
            </tr>
          </thead>
         <tbody>
  {filteredOrders.length > 0 ? (
    filteredOrders.map((order) => (
      <tr key={order.id}>
        <td data-label="Order ID">{order.id}</td>
        <td data-label="Customer">{order.customer}</td>
        <td data-label="Amount">{order.amount}</td>
        <td data-label="Status">
          <span className={`badge ${order.status.toLowerCase()}`}>
            {order.status}
          </span>
        </td>
        <td data-label="Ordered On">{order.date}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
        No orders found.
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Order</h3>
            <form onSubmit={handleCreateOrder}>
              <input
                type="text"
                name="id"
                placeholder="Order ID"
                value={newOrder.id}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="customer"
                placeholder="Customer Name"
                value={newOrder.customer}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="amount"
                placeholder="Amount"
                value={newOrder.amount}
                onChange={handleInputChange}
                required
              />
              <select name="status" value={newOrder.status} onChange={handleInputChange}>
                <option>Pending</option>
                <option>Shipped</option>
                <option>Delivered</option>
              </select>
              <input
                type="date"
                name="date"
                value={newOrder.date}
                onChange={handleInputChange}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  Save Order
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
