import React, { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { apiUrl } from "../../config/api";
import "./Meetings.css";

const initialMeetingState = {
  title: "",
  clientName: "",
  company: "",
  phone: "",
  email: "",
  projectTitle: "",
  projectDetails: "",
  participants: "",
  visitDate: "",
  date: "",
  status: "Upcoming",
};

function normalizeMeetingForEdit(meeting) {
  return {
    ...meeting,
    visitDate: meeting.visitDate ? String(meeting.visitDate).split("T")[0] : "",
    date: meeting.date ? String(meeting.date).split("T")[0] : "",
  };
}

function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [newMeeting, setNewMeeting] = useState(initialMeetingState);

  const loadMeetings = async () => {
    try {
      const res = await fetch(apiUrl("/api/meetings"));
      if (!res.ok) throw new Error("Failed to fetch meetings");
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      console.error(err);
      setMeetings([]);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const matchesFilter = filter === "All" || meeting.status === filter;
      const needle = search.toLowerCase();
      const matchesSearch =
        (meeting.title || "").toLowerCase().includes(needle) ||
        (meeting.company || "").toLowerCase().includes(needle) ||
        (meeting.projectTitle || "").toLowerCase().includes(needle);

      return matchesFilter && matchesSearch;
    });
  }, [filter, meetings, search]);

  const handleAddMeeting = async (e) => {
    e.preventDefault();

    if (!newMeeting.title || !newMeeting.clientName || !newMeeting.company || !newMeeting.date) {
      alert("Please fill required fields");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/meetings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMeeting),
      });

      if (!res.ok) throw new Error("Failed to save meeting");

      const data = await res.json();
      setMeetings((prev) => [data, ...prev]);
      setNewMeeting(initialMeetingState);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error saving meeting");
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    if (!editingMeeting?._id) return;

    try {
      const res = await fetch(apiUrl(`/api/meetings/${editingMeeting._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingMeeting),
      });

      if (!res.ok) throw new Error("Failed to update meeting");

      const data = await res.json();
      setMeetings((prev) => prev.map((meeting) => (meeting._id === data._id ? data : meeting)));
      setEditingMeeting(null);
    } catch (err) {
      console.error(err);
      alert("Error updating meeting");
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm("Delete this meeting?")) return;

    try {
      const res = await fetch(apiUrl(`/api/meetings/${meetingId}`), {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete meeting");

      setMeetings((prev) => prev.filter((meeting) => meeting._id !== meetingId));
    } catch (err) {
      console.error(err);
      alert("Error deleting meeting");
    }
  };

  return (
    <div className="meetings-container">
      <h2 className="meetings-heading">
        <FaCalendarAlt /> Meetings
      </h2>

      <div className="meetings-actions">
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Schedule Meeting
        </button>

        <input
          className="search-bar"
          placeholder="Search by company / project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="meeting-status">
        {["All", "Upcoming", "Completed", "Cancelled"].map((status) => (
          <div
            key={status}
            className={`stage ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </div>
        ))}
      </div>

      <div className="meetings-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Client Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Project</th>
              <th>Visit Date</th>
              <th>Meeting Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting) => (
                <tr key={meeting._id}>
                  <td data-label="Title">{meeting.title}</td>
                  <td data-label="Client Name">{meeting.clientName}</td>
                  <td data-label="Company">{meeting.company}</td>
                  <td data-label="Phone">{meeting.phone || "—"}</td>
                  <td data-label="Email">{meeting.email || "—"}</td>
                  <td data-label="Project">{meeting.projectTitle || "—"}</td>
                  <td data-label="Visit Date">
                    {meeting.visitDate ? new Date(meeting.visitDate).toLocaleDateString() : "—"}
                  </td>
                  <td data-label="Meeting Date">
                    {meeting.date ? new Date(meeting.date).toLocaleDateString() : "—"}
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${meeting.status.toLowerCase()}`}>
                      {meeting.status}
                    </span>
                  </td>
                  <td data-label="Actions" className="meeting-actions-cell">
                    <button
                      className="btn-secondary meeting-action-btn"
                      onClick={() => setEditingMeeting(normalizeMeetingForEdit(meeting))}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger meeting-action-btn"
                      onClick={() => handleDeleteMeeting(meeting._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: "center" }}>
                  No meetings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-simple">
              <h3>Meetings</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleAddMeeting}>
                <div className="form-grid">
                  <input
                    placeholder="Meeting Title *"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  />

                  <input
                    placeholder="Client Name *"
                    value={newMeeting.clientName}
                    onChange={(e) => setNewMeeting({ ...newMeeting, clientName: e.target.value })}
                  />

                  <input
                    placeholder="Company *"
                    value={newMeeting.company}
                    onChange={(e) => setNewMeeting({ ...newMeeting, company: e.target.value })}
                  />

                  <input
                    placeholder="Phone"
                    value={newMeeting.phone}
                    onChange={(e) => setNewMeeting({ ...newMeeting, phone: e.target.value })}
                  />

                  <input
                    placeholder="Email"
                    value={newMeeting.email}
                    onChange={(e) => setNewMeeting({ ...newMeeting, email: e.target.value })}
                  />

                  <input
                    placeholder="Project Title"
                    value={newMeeting.projectTitle}
                    onChange={(e) => setNewMeeting({ ...newMeeting, projectTitle: e.target.value })}
                  />

                  <input
                    type="date"
                    value={newMeeting.visitDate}
                    onChange={(e) => setNewMeeting({ ...newMeeting, visitDate: e.target.value })}
                  />

                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  />

                  <select
                    value={newMeeting.status}
                    onChange={(e) => setNewMeeting({ ...newMeeting, status: e.target.value })}
                  >
                    <option>Upcoming</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editingMeeting && (
        <div className="modal-overlay" onClick={() => setEditingMeeting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-simple">
              <h3>Edit Meeting</h3>
              <button
                className="modal-close"
                onClick={() => setEditingMeeting(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleUpdateMeeting}>
                <div className="form-grid">
                  <input
                    placeholder="Meeting Title *"
                    value={editingMeeting.title}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                  />

                  <input
                    placeholder="Client Name *"
                    value={editingMeeting.clientName}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, clientName: e.target.value })}
                  />

                  <input
                    placeholder="Company *"
                    value={editingMeeting.company}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, company: e.target.value })}
                  />

                  <input
                    placeholder="Phone"
                    value={editingMeeting.phone || ""}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, phone: e.target.value })}
                  />

                  <input
                    placeholder="Email"
                    value={editingMeeting.email || ""}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, email: e.target.value })}
                  />

                  <input
                    placeholder="Project Title"
                    value={editingMeeting.projectTitle || ""}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, projectTitle: e.target.value })}
                  />

                  <input
                    type="date"
                    value={editingMeeting.visitDate || ""}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, visitDate: e.target.value })}
                  />

                  <input
                    type="date"
                    value={editingMeeting.date || ""}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, date: e.target.value })}
                  />

                  <select
                    value={editingMeeting.status}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, status: e.target.value })}
                  >
                    <option>Upcoming</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingMeeting(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Update Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Meetings;
