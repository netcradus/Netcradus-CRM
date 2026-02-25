import React, { useState, useEffect } from "react";
import { FaBullhorn } from "react-icons/fa";
import "./Campaigns.css";
import { apiUrl } from "../../config/api";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "",
    status: "Active",
    startDate: "",
    endDate: "",
  });
  const [filter, setFilter] = useState("All");

  // Fetch campaigns from backend
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(apiUrl("/api/campaigns"));
      const data = await res.json();
      setCampaigns(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setLoading(false);
    }
  };

  // Open / Close Modal
  const handleAddCampaign = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // Handle input change
  const handleChange = (e) => {
    setNewCampaign({ ...newCampaign, [e.target.name]: e.target.value });
  };

  // Submit new campaign
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/campaigns"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign),
      });
      const savedCampaign = await res.json();
      setCampaigns([savedCampaign, ...campaigns]);
      setNewCampaign({
        name: "",
        channel: "",
        status: "Active",
        startDate: "",
        endDate: "",
      });
      handleCloseModal();
    } catch (err) {
      console.error("Error adding campaign:", err);
    }
  };

  // Delete campaign
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    try {
      await fetch(apiUrl(`/api/campaigns/${id}`), { method: "DELETE" });
      setCampaigns(campaigns.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Error deleting campaign:", err);
    }
  };

  // Filter campaigns
  const filteredCampaigns =
    filter === "All"
      ? campaigns
      : campaigns.filter((c) => c.status === filter);

  if (loading) return <p>Loading campaigns...</p>;

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h2 className="campaigns-heading"><FaBullhorn /> Campaigns</h2>
        <button className="add-campaign-btn" onClick={handleAddCampaign}>
          + Add New Campaign
        </button>
      </div>

      <div className="campaign-status-tabs">
        {["All", "Active", "Paused"].map((tab) => (
          <span
            key={tab}
            className={`tab ${filter === tab ? "active" : ""}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="campaigns-table">
        <table>
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.channel}</td>
                  <td>
                    <span className={`badge ${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{new Date(c.startDate).toLocaleDateString()}</td>
                  <td>{new Date(c.endDate).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(c._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No campaigns found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Campaign</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Campaign Name"
                value={newCampaign.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="channel"
                placeholder="Channel (e.g., Email, Social)"
                value={newCampaign.channel}
                onChange={handleChange}
                required
              />
              <select
                name="status"
                value={newCampaign.status}
                onChange={handleChange}
              >
                <option>Active</option>
                <option>Paused</option>
              </select>
              <input
                type="date"
                name="startDate"
                value={newCampaign.startDate}
                onChange={handleChange}
                required
              />
              <input
                type="date"
                name="endDate"
                value={newCampaign.endDate}
                onChange={handleChange}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
