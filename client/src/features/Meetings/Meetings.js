import React, { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import "./Meetings.css";
import { useEffect } from "react";


function Meetings() {
  const [meetings, setMeetings] = useState([]);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    clientName: "",   // 👈 ADD THIS
    company: "",
    phone: "",
    email: "",
    projectTitle: "",
    projectDetails: "",
    participants: "",
    visitDate: "",
    date: "",
    status: "Upcoming",
  });

  // Filter logic
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesFilter = filter === "All" || meeting.status === filter;
    const matchesSearch =
      meeting.title.toLowerCase().includes(search.toLowerCase()) ||
      meeting.company.toLowerCase().includes(search.toLowerCase()) ||
      meeting.projectTitle.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Add Meeting
  const handleAddMeeting = async (e) => {
    e.preventDefault();

    if (
      !newMeeting.title ||
      !newMeeting.clientName ||
      !newMeeting.company ||
      !newMeeting.date
    ) {
      alert("Please fill required fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMeeting),
      });

      const data = await res.json();

      // ✅ Update UI instantly
      setMeetings((prev) => [data, ...prev]);

      // Reset form
      setNewMeeting({
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
      });

      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error saving meeting");
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/meetings")
      .then((res) => res.json())
      .then((data) => setMeetings(data))
      .catch((err) => console.error(err));
  }, []);

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

      {/* Filter */}
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

      {/* Table */}
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
            </tr>
          </thead>

          <tbody>
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((m, i) => (
                <tr key={i}>
                  <td data-label="Title">{m.title}</td>
                  <td data-label="Client">{m.clientName}</td>
                  <td data-label="Company">{m.company}</td>
                  <td data-label="Phone">{m.phone}</td>
                  <td data-label="Email">{m.email}</td>
                  <td data-label="Project">{m.projectTitle}</td>
                  <td data-label="Visit Date">
                    {m.visitDate ? new Date(m.visitDate).toLocaleDateString() : "—"}
                  </td>
                  <td data-label="Meeting Date">
                    {new Date(m.date).toLocaleDateString()}
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${m.status.toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No meetings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {/* SIMPLE HEADER */}
            <div className="modal-header-simple">
              <h3>Meetings</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              <form>

                <div className="form-grid">

                  <div className="form-group">
                    <label>Meeting Title *</label>
                    <input
                      value={newMeeting.title}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Client Name *</label>
                    <input
                      value={newMeeting.clientName}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, clientName: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Company *</label>
                    <input
                      value={newMeeting.company}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, company: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={newMeeting.phone}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      value={newMeeting.email}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Project Title</label>
                    <input
                      value={newMeeting.projectTitle}
                      onChange={(e) =>
                        setNewMeeting({
                          ...newMeeting,
                          projectTitle: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Visit Date</label>
                    <input
                      type="date"
                      value={newMeeting.visitDate}
                      onChange={(e) =>
                        setNewMeeting({
                          ...newMeeting,
                          visitDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Meeting Date *</label>
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, date: e.target.value })
                      }
                    />
                  </div>



                  <div className="form-group full">
                    <label>Status</label>
                    <select
                      value={newMeeting.status}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, status: e.target.value })
                      }
                    >
                      <option>Upcoming</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>

                </div>

              </form>
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>



              <button
                className="btn-primary"
                onClick={handleAddMeeting}
              >
                Schedule Meeting
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Meetings;