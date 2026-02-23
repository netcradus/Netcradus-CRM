import React, { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import "./Meetings.css";

function Meetings() {
  const [meetings, setMeetings] = useState([
   
  ]);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    participants: "",
    date: "",
    status: "Upcoming",
  });

  // Filter meetings by status + search
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesFilter = filter === "All" || meeting.status === filter;
    const matchesSearch =
      meeting.title.toLowerCase().includes(search.toLowerCase()) ||
      meeting.participants.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Add new meeting
  const handleAddMeeting = (e) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.participants || !newMeeting.date) return;
    setMeetings([...meetings, newMeeting]);
    setNewMeeting({ title: "", participants: "", date: "", status: "Upcoming" });
    setShowModal(false);
  };

  return (
    <div className="meetings-container">
      <h2 className="meetings-heading"><FaCalendarAlt /> Meetings</h2>

      <div className="meetings-actions">
        <button className="btn-primary" onClick={() => setShowModal(true)}>Schedule Meeting</button>
        <input
          className="search-bar"
          type="text"
          placeholder="Search Meetings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Buttons */}
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

      {/* Meetings Table */}
      <div className="meetings-table">
        <table>
          <thead>
            <tr>
              <th>Meeting Title</th>
              <th>Participants</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting, i) => (
                <tr key={i}>
                  <td>{meeting.title}</td>
                  <td>{meeting.participants}</td>
                  <td>{meeting.date}</td>
                  <td><span className={`badge ${meeting.status.toLowerCase()}`}>{meeting.status}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>No meetings found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Scheduling Meeting */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Schedule New Meeting</h3>
            <form onSubmit={handleAddMeeting}>
              <input
                type="text"
                placeholder="Meeting Title"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Participants (comma separated)"
                value={newMeeting.participants}
                onChange={(e) => setNewMeeting({ ...newMeeting, participants: e.target.value })}
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
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Add Meeting</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Meetings;
