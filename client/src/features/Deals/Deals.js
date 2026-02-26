import React, { useState } from "react";
import "./Deals.css";
import { FaHandshake } from "react-icons/fa";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: "",
    status: "New",
    value: "",
    assignedTo: ""
  });

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setNewDeal({ ...newDeal, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dealToAdd = { ...newDeal, id: Date.now() };
    setDeals([dealToAdd, ...deals]);
    setNewDeal({ name: "", status: "New", value: "", assignedTo: "" });
    closeModal();
  };

  return (
    <div className="deals-container">
      <h2 className="deals-heading"><FaHandshake /> Deals Management</h2>

      <div className="deals-actions">
        <button className="btn-primary" onClick={openModal}>+ Add New Deal</button>
        <input className="search-bar" placeholder="Search deals..." />
      </div>

      <div className="pipeline-stages">
        <div className="stage">New</div>
        <div className="stage">In Progress</div>
        <div className="stage won">Won</div>
        <div className="stage lost">Lost</div>
      </div>

      <div className="deals-table">
        <table>
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Status</th>
              <th>Value</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>No deals found.</td>
              </tr>
            ) : (
              deals.map((deal) => (
                <tr key={deal.id}>
                  <td data-label="Deal Name">{deal.name}</td>
                  <td data-label="Status">
                    <span className={`badge ${deal.status.toLowerCase().replace(" ", "-")}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td data-label="Value">{deal.value}</td>
                  <td data-label="Assigned To">{deal.assignedTo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Deal</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Deal Name"
                value={newDeal.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="value"
                placeholder="Value"
                value={newDeal.value}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="assignedTo"
                placeholder="Assigned To"
                value={newDeal.assignedTo}
                onChange={handleChange}
                required
              />
              <select name="status" value={newDeal.status} onChange={handleChange}>
                <option>New</option>
                <option>In Progress</option>
                <option>Won</option>
                <option>Lost</option>
              </select>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Save Deal</button>
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deals;