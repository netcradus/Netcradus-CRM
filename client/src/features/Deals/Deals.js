import React, { useState } from "react";
import "./Deals.css";
import { Handshake, Plus, Search } from "lucide-react";

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
    <div className="nc-page deals-page">
      <div className="nc-hero">
        <div>
          <div className="nc-badge">
            <Handshake size={14} />
            <span>Netcradus Deal Room</span>
          </div>
          <h1 className="nc-hero-title">
            Deals <span className="nc-gradient-text">Pipeline</span>
          </h1>
          <p className="nc-hero-subtitle">
            Track opportunity health, update stages, and keep revenue forecasting accurate.
          </p>
        </div>
      </div>

      <div className="nc-panel nc-section">
        <div className="nc-controls">
          <div className="nc-controls-left">
            <div className="deals-search">
              <Search size={16} />
              <input className="nc-input deals-search-input" placeholder="Search deals..." />
            </div>
          </div>
          <div className="nc-controls-right">
            <button className="nc-btn nc-btn--primary" onClick={openModal}>
              <Plus size={16} />
              Add Deal
            </button>
          </div>
        </div>
      </div>

      <div className="pipeline-stages">
        <div className="stage">New</div>
        <div className="stage">In Progress</div>
        <div className="stage won">Won</div>
        <div className="stage lost">Lost</div>
      </div>

      <div className="nc-panel nc-section">
        <div className="nc-table-wrap">
          <table className="nc-table">
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
                    {deal.status === "Won" ? (
                      <span className="nc-status nc-status--ok">Won</span>
                    ) : deal.status === "Lost" ? (
                      <span className="nc-status nc-status--pending">Lost</span>
                    ) : deal.status === "In Progress" ? (
                      <span className="nc-status nc-status--done">In Progress</span>
                    ) : (
                      <span className="nc-status nc-status--pending">New</span>
                    )}
                  </td>
                  <td data-label="Value">{deal.value}</td>
                  <td data-label="Assigned To">{deal.assignedTo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
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
                <button type="submit" className="nc-btn nc-btn--primary">Save Deal</button>
                <button type="button" className="nc-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deals;