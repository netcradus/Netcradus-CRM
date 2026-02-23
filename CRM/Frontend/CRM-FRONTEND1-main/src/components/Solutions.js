import React, { useState } from "react";
import { FaLightbulb } from "react-icons/fa";
import "./Solutions.css";

const initialSolutions = [
 
];

function Solutions() {
  const [solutions, setSolutions] = useState(initialSolutions);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    id: "",
    title: "",
    client: "",
    date: "",
    status: "Pending",
    notes: "",
  });
  const [filter, setFilter] = useState("All");

  const handleAddSolution = (e) => {
    e.preventDefault();
    const newId = form.id || `S${String(solutions.length + 1).padStart(3, "0")}`;
    const newSolution = { ...form, id: newId };
    setSolutions([...solutions, newSolution]);
    setForm({
      id: "",
      title: "",
      client: "",
      date: "",
      status: "Pending",
      notes: "",
    });
    setShowModal(false);
  };

  // ✅ Filtered list based on filter state
  const filteredSolutions =
    filter === "All"
      ? solutions
      : solutions.filter((s) => s.status === filter);

  // ✅ Summary counts
  const total = solutions.length;
  const delivered = solutions.filter((s) => s.status === "Delivered").length;
  const inProgress = solutions.filter((s) => s.status === "In Progress").length;
  const pending = solutions.filter((s) => s.status === "Pending").length;

  return (
    <div className="solutions-container">
      <h2 className="solutions-heading"><FaLightbulb /> Client Solutions</h2>

      {/* Summary */}
      <div className="solutions-summary">
        <div
          className={`summary-card total ${filter === "All" ? "active" : ""}`}
          onClick={() => setFilter("All")}
        >
          <h4>Total Solutions</h4>
          <p>{total}</p>
        </div>
        <div
          className={`summary-card delivered ${
            filter === "Delivered" ? "active" : ""
          }`}
          onClick={() => setFilter("Delivered")}
        >
          <h4>Delivered</h4>
          <p>{delivered}</p>
        </div>
        <div
          className={`summary-card in-progress ${
            filter === "In Progress" ? "active" : ""
          }`}
          onClick={() => setFilter("In Progress")}
        >
          <h4>In Progress</h4>
          <p>{inProgress}</p>
        </div>
        <div
          className={`summary-card pending ${
            filter === "Pending" ? "active" : ""
          }`}
          onClick={() => setFilter("Pending")}
        >
          <h4>Pending</h4>
          <p>{pending}</p>
        </div>
      </div>

      {/* Table */}
      <div className="solutions-table-wrapper">
        <table className="solutions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Client</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredSolutions.map((sol, index) => (
              <tr key={index}>
                <td>{sol.id}</td>
                <td>{sol.title}</td>
                <td>{sol.client}</td>
                <td>{sol.date}</td>
                <td>
                  <span
                    className={`status-badge ${sol.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {sol.status}
                  </span>
                </td>
                <td>{sol.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Button */}
      <button className="add-btn" onClick={() => setShowModal(true)}>
        + Add New Solution
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Solution</h3>
            <form onSubmit={handleAddSolution}>
              <input
                type="text"
                placeholder="ID (Optional)"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                required
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Client"
                value={form.client}
                required
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
              <input
                type="date"
                value={form.date}
                required
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Delivered</option>
                <option>In Progress</option>
                <option>Pending</option>
              </select>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Add
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

export default Solutions;
