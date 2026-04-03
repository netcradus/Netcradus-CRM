import React, { useState, useEffect } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { apiUrl } from "../../config/api";

import "./Meetings.css";

function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
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

  // ✅ FETCH MEETINGS
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch(apiUrl("/api/meetings")); // ✅ FIXED
        if (!res.ok) throw new Error("Failed to fetch meetings");
        const data = await res.json();
        setMeetings(data);
      } catch (err) {
        console.error(err);
        setMeetings([]);
      }
    };

    fetchMeetings();
  }, []);

  // ✅ FILTER (SAFE VERSION)
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesFilter = filter === "All" || meeting.status === filter;

    const matchesSearch =
      (meeting.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (meeting.company || "").toLowerCase().includes(search.toLowerCase()) ||
      (meeting.projectTitle || "").toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // ✅ ADD MEETING
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
      const res = await fetch(apiUrl("/api/meetings"), { // ✅ FIXED
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMeeting),
      });

      if (!res.ok) throw new Error("Failed to save meeting");

      const data = await res.json();

      setMeetings((prev) => [data, ...prev]);

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

  return (
    <div className="meetings-container">
      <h2 className="meetings-heading">
        <FaCalendarAlt /> Meetings
      </h2>

      {/* ACTIONS */}
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

      {/* FILTER */}
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

      {/* TABLE */}
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
                  <td>{m.title}</td>
                  <td>{m.clientName}</td>
                  <td>{m.company}</td>
                  <td>{m.phone}</td>
                  <td>{m.email}</td>
                  <td>{m.projectTitle}</td>

                  <td>
                    {m.visitDate
                      ? new Date(m.visitDate).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    {m.date
                      ? new Date(m.date).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <span className={`badge ${m.status.toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
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
            
            {/* HEADER */}
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

                  <input
                    placeholder="Meeting Title *"
                    value={newMeeting.title}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, title: e.target.value })
                    }
                  />

                  <input
                    placeholder="Client Name *"
                    value={newMeeting.clientName}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, clientName: e.target.value })
                    }
                  />

                  <input
                    placeholder="Company *"
                    value={newMeeting.company}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, company: e.target.value })
                    }
                  />

                  <input
                    placeholder="Phone"
                    value={newMeeting.phone}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, phone: e.target.value })
                    }
                  />

                  <input
                    placeholder="Email"
                    value={newMeeting.email}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, email: e.target.value })
                    }
                  />

                  <input
                    placeholder="Project Title"
                    value={newMeeting.projectTitle}
                    onChange={(e) =>
                      setNewMeeting({
                        ...newMeeting,
                        projectTitle: e.target.value,
                      })
                    }
                  />

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

                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, date: e.target.value })
                    }
                  />

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