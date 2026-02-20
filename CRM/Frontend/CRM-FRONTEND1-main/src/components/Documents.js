import React, { useState } from "react";
import { FaFolder } from "react-icons/fa";
import "./Documents.css";

const initialDocuments = [
 
];

const Documents = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "PDF",
    created: "",
    modified: "",
    owner: "",
    status: "Active",
  });

  // Handle Add New Document
  const handleAddDocument = (e) => {
    e.preventDefault();
    setDocuments([...documents, form]);
    setForm({
      name: "",
      category: "PDF",
      created: "",
      modified: "",
      owner: "",
      status: "Active",
    });
    setShowModal(false);
  };

  return (
    <div className="documents-container">
      <h2 className="documents-title"><FaFolder /> Documents</h2>

      <div className="document-table-wrapper">
        <table className="document-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Category</th>
              <th>Created Date</th>
              <th>Last Modified</th>
              <th>Owner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={index}>
                <td>{doc.name}</td>
                <td>{doc.category}</td>
                <td>{doc.created}</td>
                <td>{doc.modified}</td>
                <td>{doc.owner}</td>
                <td>
                  <span
                    className={`status-badge ${
                      doc.status === "Active" ? "active" : "inactive"
                    }`}
                  >
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Document Button */}
      <div className="bottom-right-button">
        <button className="add-document-btn" onClick={() => setShowModal(true)}>
          + Add New Document
        </button>
      </div>

      {/* Popup Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Document</h3>
            <form onSubmit={handleAddDocument}>
              <input
                type="text"
                placeholder="Document Name"
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option>PDF</option>
                <option>DOCX</option>
                <option>XLSX</option>
                <option>PPTX</option>
              </select>
              <input
                type="date"
                value={form.created}
                required
                onChange={(e) => setForm({ ...form, created: e.target.value })}
              />
              <input
                type="date"
                value={form.modified}
                required
                onChange={(e) => setForm({ ...form, modified: e.target.value })}
              />
              <input
                type="text"
                placeholder="Owner"
                value={form.owner}
                required
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Add
                </button>
                <button
                  type="button"
                  className="btn-cancel"
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
};

export default Documents;
