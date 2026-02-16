import React, { useState } from "react";
import "./PurchaseOrders.css";

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([
    
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ id: "", vendor: "", amount: "", status: "pending", date: "" });

  const handleView = (id) => alert(`Viewing details of ${id}`);
  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete ${id}?`)) {
      setOrders(orders.filter(order => order.id !== id));
    }
  };

  const handleInputChange = (e) => {
    setNewOrder({ ...newOrder, [e.target.name]: e.target.value });
  };

  const handleAddOrder = (e) => {
    e.preventDefault();
    setOrders([...orders, newOrder]);
    setNewOrder({ id: "", vendor: "", amount: "", status: "pending", date: "" });
    setShowModal(false);
  };

  return (
    <div className="po-container">
      <div className="po-header">Purchase Orders</div>

      <div className="po-actions">
        <button className="po-add-btn" onClick={() => setShowModal(true)}>
          + Add New Purchase Order
        </button>
      </div>

      <table className="po-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Vendor</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={index}>
              <td>{order.id}</td>
              <td>{order.vendor}</td>
              <td>{order.amount}</td>
              <td>
                <span className={`po-status ${order.status}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </td>
              <td>{order.date}</td>
              <td>
                <button className="po-action-btn view" onClick={() => handleView(order.id)}>View</button>
                <button className="po-action-btn delete" onClick={() => handleDelete(order.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="po-modal-overlay">
          <div className="po-modal-content">
            <h3>Add New Purchase Order</h3>
            <form onSubmit={handleAddOrder}>
              <input type="text" name="id" placeholder="Order ID" value={newOrder.id} onChange={handleInputChange} required />
              <input type="text" name="vendor" placeholder="Vendor Name" value={newOrder.vendor} onChange={handleInputChange} required />
              <input type="text" name="amount" placeholder="Amount" value={newOrder.amount} onChange={handleInputChange} required />
              <select name="status" value={newOrder.status} onChange={handleInputChange}>
                {/* <p><strong>Date:</strong> {selectedOrder.date}</p>
            <div className="po-modal-buttons">
              <button className="po-cancel-btn" onClick={() => setShowViewModal(false)}>Close</button>
            </div> */}
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input type="date" name="date" value={newOrder.date} onChange={handleInputChange} required />
              <div className="po-modal-buttons">
                <button type="submit" className="po-add-btn">Save</button>
                <button type="button" className="po-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
