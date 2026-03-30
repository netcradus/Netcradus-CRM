import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaMapMarkerAlt } from "react-icons/fa";
import "./Visits.css";

const API = "http://localhost:5000/api/visits";

function Visits() {
  const [visits, setVisits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const [form, setForm] = useState({
    client: "",
    date: "",
    time: "",
    status: "Scheduled",
    notes: "",
  });

  // FETCH DATA
  const fetchVisits = async () => {
    try {
      const res = await axios.get(API);
      setVisits(res.data);
    } catch (err) {
      console.error("Error fetching visits:", err);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // ADD VISIT
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.client || !form.date || !form.time) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await axios.post(API, form);
      setShowModal(false);
      setForm({
        client: "",
        date: "",
        time: "",
        status: "Scheduled",
        notes: "",
      });
      fetchVisits();
    } catch (err) {
      console.error("Error adding visit:", err);
      alert("Error adding visit");
    }
  };

  // UPDATE VISIT
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/${editModal._id}`, editModal);
      setEditModal(null);
      fetchVisits();
    } catch (err) {
      console.error("Error updating visit:", err);
      alert("Error updating visit");
    }
  };

  // DELETE VISIT
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this visit?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchVisits();
    } catch (err) {
      console.error("Error deleting visit:", err);
      alert("Error deleting visit");
    }
  };

  // SUMMARY STATS
  const totalVisits = visits.length;
  const completed = visits.filter((v) => v.status === "Completed").length;
  const scheduled = visits.filter((v) => v.status === "Scheduled").length;
  const cancelled = visits.filter((v) => v.status === "Cancelled").length;

  return (
    <div className="visits-container">
      <h2 className="visits-heading">
        <FaMapMarkerAlt /> Client Visits
      </h2>

      <button className="add-btn" onClick={() => setShowModal(true)}>
        + Schedule Visit
      </button>

      {/* SUMMARY CARDS */}
      <div className="visits-summary">
        <div className="summary-card total">
          <h4>Total Visits</h4>
          <p>{totalVisits}</p>
        </div>
        <div className="summary-card completed">
          <h4>Completed</h4>
          <p>{completed}</p>
        </div>
        <div className="summary-card scheduled">
          <h4>Scheduled</h4>
          <p>{scheduled}</p>
        </div>
        <div className="summary-card cancelled">
          <h4>Cancelled</h4>
          <p>{cancelled}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="visits-table-wrapper">
        <table className="visits-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Client</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {visits.length > 0 ? (
              visits.map((visit, index) => (
                <tr key={visit._id}>
                  <td data-label="ID">{index + 1}</td>
                  <td data-label="Client">{visit.client}</td>
                  <td data-label="Date">
                    {new Date(visit.date).toLocaleDateString()}
                  </td>
                  <td data-label="Time">{visit.time}</td>
                  <td data-label="Status">
                    <span
                      className={`status-badge ${visit.status.toLowerCase()}`}
                    >
                      {visit.status}
                    </span>
                  </td>
                  <td data-label="Notes">
                    {visit.notes ? visit.notes.substring(0, 40) + "..." : "—"}
                  </td>
                  <td data-label="Actions">
                    <button
                      className="btn-primary"
                      onClick={() => setViewModal(visit)}
                    >
                      View
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setEditModal(visit)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(visit._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "48px" }}>
                  <div style={{ color: "#94a3b8", fontSize: "16px" }}>
                    No visits scheduled. Create one to get started!
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== ADD MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Schedule New Visit</h3>
            <form onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Client Name"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                required
              />

              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />

              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />

              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <textarea
                placeholder="Visit Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW MODAL ===== */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Visit Details</h3>
            <p>
              <b>Client:</b> {viewModal.client}
            </p>
            <p>
              <b>Date:</b> {new Date(viewModal.date).toLocaleDateString()}
            </p>
            <p>
              <b>Time:</b> {viewModal.time}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span className={`status-badge ${viewModal.status.toLowerCase()}`}>
                {viewModal.status}
              </span>
            </p>
            <p>
              <b>Notes:</b> {viewModal.notes || "No notes"}
            </p>

            <div className="modal-actions">
              <button onClick={() => setViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reschedule Visit</h3>
            <form onSubmit={handleUpdate}>
              <input
                type="text"
                value={editModal.client}
                onChange={(e) =>
                  setEditModal({ ...editModal, client: e.target.value })
                }
              />

              <input
                type="date"
                value={editModal.date?.split("T")[0]}
                onChange={(e) =>
                  setEditModal({ ...editModal, date: e.target.value })
                }
              />

              <input
                type="time"
                value={editModal.time}
                onChange={(e) =>
                  setEditModal({ ...editModal, time: e.target.value })
                }
              />

              <select
                value={editModal.status}
                onChange={(e) =>
                  setEditModal({ ...editModal, status: e.target.value })
                }
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <textarea
                value={editModal.notes}
                onChange={(e) =>
                  setEditModal({ ...editModal, notes: e.target.value })
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Visits;