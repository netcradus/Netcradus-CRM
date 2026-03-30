import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Deals.css";
import { Handshake, Plus, Search } from "lucide-react";

const API = "http://localhost:5000/api/deals";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);

const [form, setForm] = useState({
  name: "",
  status: "In Progress",
  value: "",
  assignedTo: "",
  date: "",
});

  // 🔥 FETCH
  const fetchDeals = async () => {
    const res = await axios.get(API);
    setDeals(res.data);
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // 🔥 INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 CREATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(API, form);
    fetchDeals();
    setShowModal(false);
    setForm({ name: "", status: "New", value: "", assignedTo: "" });
  };

  // 🔥 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deal?")) return;
    await axios.delete(`${API}/${id}`);
    fetchDeals();
  };

  // 🔥 UPDATE
  const handleUpdate = async (e) => {
    e.preventDefault();
    await axios.put(`${API}/${editModal._id}`, editModal);
    setEditModal(null);
    fetchDeals();
  };

  return (
    <div className="nc-page deals-page">
      {/* HERO */}
      <div className="nc-hero">
        <div>
          <div className="nc-badge">
            <Handshake size={14} />
            <span>Netcradus Deal Room</span>
          </div>
          <h1 className="nc-hero-title">
            Deals <span className="nc-gradient-text">Pipeline</span>
          </h1>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="nc-panel nc-section">
        <div className="nc-controls">
          <div className="deals-search">
            <Search size={16} />
            <input placeholder="Search deals..." />
          </div>

          <button className="nc-btn nc-btn--primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="nc-panel nc-section">
        <div className="nc-table-wrap">
          <table className="nc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Status</th>
                <th>Value</th>
                <th>Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {deals.length === 0 ? (
                <tr>
                  <td colSpan="6">No deals found</td>
                </tr>
              ) : (
                deals.map((d, i) => (
                  <tr key={d._id}>
                    <td>{i + 1}</td>
                    <td>{d.name}</td>

                    <td>
                    <span className={`status ${d.status.toLowerCase().replace(" ", "-")}`}>
                        {d.status}
                      </span>
                    </td>



                    <td>₹ {d.value}</td>

                    <td>{d.assignedTo}</td>
                    

                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => setEditModal(d)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(d._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== ADD MODAL ===== */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Deal</h3>

            <form onSubmit={handleSubmit}>
              <input name="name" placeholder="Deal Name" onChange={handleChange} required />
              <input name="value" placeholder="Value" onChange={handleChange} required />
              <input name="assignedTo" placeholder="Assigned To" onChange={handleChange} required />

              <select name="status" onChange={handleChange}>
                <option>New</option>
                <option>In Progress</option>
                <option>Won</option>
                <option>Lost</option>
              </select>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Deal</h3>

            <form onSubmit={handleUpdate}>
              <input
                value={editModal.name}
                onChange={(e) =>
                  setEditModal({ ...editModal, name: e.target.value })
                }
              />

              <input
                value={editModal.value}
                onChange={(e) =>
                  setEditModal({ ...editModal, value: e.target.value })
                }
              />

              <input
                value={editModal.assignedTo}
                onChange={(e) =>
                  setEditModal({ ...editModal, assignedTo: e.target.value })
                }
              />

              <select
                value={editModal.status}
                onChange={(e) =>
                  setEditModal({ ...editModal, status: e.target.value })
                }
              >
                <option>New</option>
                <option>In Progress</option>
                <option>Won</option>
                <option>Lost</option>
              </select>

              <div className="modal-actions">
                <button onClick={() => setEditModal(null)}>Cancel</button>
                <button className="btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deals;