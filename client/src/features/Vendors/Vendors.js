import React, { useState } from "react";
import { FaStore } from "react-icons/fa";
import "./Vendors.css";

function Vendors() {
  const [showModal, setShowModal] = useState(false); // Modal state
  const [newVendor, setNewVendor] = useState({
    name: "",
    email: "",
    category: "Supplier",
    status: "Active",
    lastInteraction: "",
  });

  const handleAddVendor = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    setNewVendor({ ...newVendor, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Vendor:", newVendor); // Replace with API call later
    setNewVendor({
      name: "",
      email: "",
      category: "Supplier",
      status: "Active",
      lastInteraction: "",
    });
    handleCloseModal();
  };

  return (
    <div className="vendors-container">
      <h2 className="vendors-heading"><FaStore /> Vendors</h2>

      <div className="vendors-actions">
        <button className="btn-primary" onClick={handleAddVendor}>
          Add Vendor
        </button>
        <input className="search-bar" type="text" placeholder="Search Vendors" />
      </div>

      <div className="vendor-types">
        <div className="type">Supplier</div>
        <div className="type partner">Partner</div>
        <div className="type inactive">Inactive</div>
      </div>

      <div className="vendors-table">
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Email</th>
              <th>Category</th>
              <th>Status</th>
              <th>Last Interaction</th>
            </tr>
          </thead>
         <tbody>
  <tr>
    <td data-label="Vendor Name">ABC Suppliers</td>
    <td data-label="Email">abc@email.com</td>
    <td data-label="Category">Supplier</td>
    <td data-label="Status">
      <span className="badge active">Active</span>
    </td>
    <td data-label="Last Interaction">Mar 2, 2026</td>
  </tr>
</tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Vendor</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Vendor Name"
                value={newVendor.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={newVendor.email}
                onChange={handleChange}
                required
              />
              <select
                name="category"
                value={newVendor.category}
                onChange={handleChange}
              >
                <option>Supplier</option>
                <option>Partner</option>
                <option>Inactive</option>
              </select>
              <select
                name="status"
                value={newVendor.status}
                onChange={handleChange}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <input
                type="date"
                name="lastInteraction"
                value={newVendor.lastInteraction}
                onChange={handleChange}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendors;
