import React, { useState } from "react";
import { FaCheckDouble } from "react-icons/fa";
import "./Cases.css";

function Cases() {
  const [cases, setCases] = useState([
   
  ]);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    title: "",
    assignedTo: "",
    status: "Open",
  });

  // ✅ Filter cases based on search
  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.assignedTo.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Handle form submit
  const handleCreateCase = (e) => {
    e.preventDefault();
    const newId = `#C-${2000 + cases.length + 1}`;
    const createdDate = new Date().toISOString().split("T")[0];

    const caseToAdd = { ...newCase, id: newId, created: createdDate };
    setCases([caseToAdd, ...cases]);

    // reset and close
    setNewCase({ title: "", assignedTo: "", status: "Open" });
    setIsModalOpen(false);
  };

  return (
    <div className="cases-container">
      <h2 className="cases-heading"><FaCheckDouble /> Cases</h2>

      {/* Actions */}
      <div className="cases-actions">
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create Case
        </button>
        <input
          className="search-bar"
          type="text"
          placeholder="Search Cases"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="case-status-filters">
        <div className="status-filter open">Open</div>
        <div className="status-filter in-progress">In Progress</div>
        <div className="status-filter resolved">Resolved</div>
      </div>

      {/* Table */}
      <div className="cases-table-wrapper">
        <table className="cases-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
        <tbody>
  {filteredCases.length > 0 ? (
    filteredCases.map((c, index) => (
      <tr key={index}>
        <td data-label="Case ID">{c.id}</td>
        <td data-label="Title">{c.title}</td>
        <td data-label="Assigned To">{c.assignedTo}</td>
        <td data-label="Status">
          <span
            className={`badge ${c.status.toLowerCase().replace(" ", "-")}`}
          >
            {c.status}
          </span>
        </td>
        <td data-label="Created">{c.created}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
        ❌ No cases found
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>

      {/* ✅ Modal Form */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Case</h3>
            <form onSubmit={handleCreateCase}>
              <input
                type="text"
                placeholder="Case Title"
                value={newCase.title}
                onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Assigned To"
                value={newCase.assignedTo}
                onChange={(e) => setNewCase({ ...newCase, assignedTo: e.target.value })}
                required
              />
              <select
                value={newCase.status}
                onChange={(e) => setNewCase({ ...newCase, status: e.target.value })}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <div className="modal-buttons">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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

export default Cases;
