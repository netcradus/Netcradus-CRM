import React, { useState } from "react";
import { FaPhone } from "react-icons/fa";
import "./Calls.css";

function Calls() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calls, setCalls] = useState([
    { id: 1, caller: "Alice", recipient: "Bob", date: "2026-02-26", status: "Scheduled", duration: "10m" },
    { id: 2, caller: "Charlie", recipient: "David", date: "2026-02-25", status: "Completed", duration: "5m" },
  ]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="calls-container">
      <div className="calls-header">
        <h2 className="calls-heading"><FaPhone /> Calls</h2>
      </div>

      <div className="calls-actions">
        <button className="btn-primary" onClick={openModal}>+ Add Call</button>
        <div className="calls-filters">
          <input className="search-bar" type="text" placeholder="Search Calls" />
          <select className="filter-dropdown">
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Calls Table */}
      <table className="calls-table">
        <thead>
          <tr>
            <th>Caller</th>
            <th>Recipient</th>
            <th>Date</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id}>
              <td data-label="Caller">{call.caller}</td>
              <td data-label="Recipient">{call.recipient}</td>
              <td data-label="Date">{call.date}</td>
              <td data-label="Status"><span className={`status ${call.status.toLowerCase()}`}>{call.status}</span></td>
              <td data-label="Duration">{call.duration}</td>
              <td data-label="Actions">
                <button className="btn-small">Edit</button>
                <button className="btn-small danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Call Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Schedule a Call</h3>
            <form>
              <label>Caller</label>
              <input type="text" placeholder="Enter caller name" />
              <label>Recipient</label>
              <input type="text" placeholder="Enter recipient name" />
              <label>Date</label>
              <input type="date" />
              <label>Status</label>
              <select>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calls;