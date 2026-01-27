import React, { useState, useEffect } from "react";
import "./SalesInbox.css";

const BACKEND_URL = "http://localhost:5000"; // backend URL

const SalesInbox = () => {
  const [inboxData, setInboxData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: "",
    sender: "",
    recipient: "",
    message: "",
    category: "General",
    status: "Unread",
    date: new Date().toISOString(),
  });

  // Fetch emails from backend
  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales-inbox`);
      const data = await res.json();
      setInboxData(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inbox:", err);
      setLoading(false);
    }
  };

  // Toggle Read/Unread
  const toggleStatus = async (id) => {
    const msg = inboxData.find((m) => m._id === id);
    const updatedStatus = msg.status === "Unread" ? "Read" : "Unread";

    try {
      const res = await fetch(`${BACKEND_URL}/api/sales-inbox/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updatedStatus }),
      });
      const updatedMsg = await res.json();
      setInboxData(inboxData.map((m) => (m._id === id ? updatedMsg : m)));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete email
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`${BACKEND_URL}/api/sales-inbox/${id}`, { method: "DELETE" });
      setInboxData(inboxData.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Modal open/close
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // Handle form change
  const handleChange = (e) => {
    setNewMessage({ ...newMessage, [e.target.name]: e.target.value });
  };

  // Submit new message
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales-inbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
      const savedMessage = await res.json();
      setInboxData([savedMessage, ...inboxData]);
      setNewMessage({
        subject: "",
        sender: "",
        recipient: "",
        message: "",
        category: "General",
        status: "Unread",
        date: new Date().toISOString(),
      });
      closeModal();
    } catch (err) {
      console.error("Error adding message:", err);
    }
  };

  // Filter inbox by search
  const filteredInbox = inboxData.filter(
    (msg) =>
      msg.subject.toLowerCase().includes(search.toLowerCase()) ||
      msg.sender.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p>Loading inbox...</p>;

  return (
    <div className="sales-inbox-container">
      <h2 className="sales-inbox-heading">Sales Inbox</h2>

      {/* Actions */}
      <div className="sales-inbox-actions">
        <button className="btn-primary" onClick={openModal}>
          + Add New Sales
        </button>
        <input
          type="text"
          placeholder="Search inbox..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="inbox-search-bar"
        />
      </div>

      {/* Inbox Table */}
      <div className="sales-inbox-table">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
              <th>Status</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInbox.length > 0 ? (
              filteredInbox.map((msg) => (
                <tr key={msg._id}>
                  <td>{msg.subject}</td>
                  <td>{msg.sender}</td>
                  <td>{msg.recipient}</td>
                  <td>{new Date(msg.date).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`badge ${msg.status.toLowerCase()}`}
                      onClick={() => toggleStatus(msg._id)}
                      style={{ cursor: "pointer" }}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td>{msg.category}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(msg._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No messages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Sales Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Sales</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={newMessage.subject}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="sender"
                placeholder="From"
                value={newMessage.sender}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="recipient"
                placeholder="To"
                value={newMessage.recipient}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={newMessage.category}
                onChange={handleChange}
              />
              <textarea
                name="message"
                placeholder="Message content"
                value={newMessage.message}
                onChange={handleChange}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  Save
                </button>
                <button type="button" className="btn-cancel" onClick={closeModal}>
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

export default SalesInbox;
