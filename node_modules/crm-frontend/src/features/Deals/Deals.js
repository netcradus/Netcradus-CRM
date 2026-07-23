import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { apiUrl } from "../../config/api";

const API = apiUrl("/api/deals");
const SUPER_API = apiUrl("/api/super-user/sales");
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const emptyForm = {
  name: "",
  status: "New",
  value: "",
  assignedTo: "",
  expectedCloseDate: "",
};

function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState([]);
const [leaderboard, setLeaderboard] = useState([]);
const [unassignedDeals, setUnassignedDeals] = useState([]);
const [followups, setFollowups] = useState([]);
const [activities, setActivities] = useState([]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API, getAuthConfig());
      setDeals(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load deals.");
    } finally {
      setLoading(false);
    }
  };


  const fetchSuperUserData = async () => {
  try {
    const [
      overviewRes,
      performanceRes,
      leaderboardRes,
      unassignedRes,
      followupsRes,
      activityRes,
    ] = await Promise.all([
      axios.get(`${SUPER_API}/overview`, getAuthConfig()),
      axios.get(`${SUPER_API}/performance`, getAuthConfig()),
      axios.get(`${SUPER_API}/leaderboard`, getAuthConfig()),
      axios.get(`${SUPER_API}/unassigned`, getAuthConfig()),
      axios.get(`${SUPER_API}/followups`, getAuthConfig()),
      axios.get(`${SUPER_API}/activity`, getAuthConfig()),
    ]);

    setOverview(overviewRes.data?.data || null);
    setPerformance(performanceRes.data?.data || []);
    setLeaderboard(leaderboardRes.data?.data || []);
    setUnassignedDeals(unassignedRes.data?.data || []);
    setFollowups(followupsRes.data?.data || []);
    setActivities(activityRes.data?.data || []);
  } catch (err) {
    console.error("Super User Dashboard Error:", err);
  }
};

  useEffect(() => {
  fetchDeals();
  fetchSuperUserData();
}, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      expectedCloseDate: form.expectedCloseDate || null,
    };

    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, payload, getAuthConfig());
      } else {
        await axios.post(API, payload, getAuthConfig());
      }

      await fetchDeals();
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save deal.");
    }
  };

  const handleDelete = async (dealId) => {
    if (!window.confirm("Delete deal?")) {
      return;
    }

    try {
      await axios.delete(`${API}/${dealId}`, getAuthConfig());
      await fetchDeals();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete deal.");
    }
  };


  console.log("OVERVIEW", overview);
console.log("PERFORMANCE", performance);
console.log("LEADERBOARD", leaderboard);
console.log("UNASSIGNED", unassignedDeals);
console.log("FOLLOWUPS", followups);
console.log("ACTIVITIES", activities);

  return (

    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Deals</h1>
          <p className="subtitle">Deals created from completed meetings.</p>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowModal(true);
            }}
          >
            <Plus size={16} /> New Deal
          </button>
        </div>
      </div>

      {error ? (
        <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-error)" }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <div className="nc-stat-card">
          <span className="metric-label">Pipeline Value</span>
          <span className="metric-value">Rs. {deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Deals</span>
          <span className="metric-value">{deals.filter((deal) => deal.status !== "Lost").length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Won Deals</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>{deals.filter((deal) => deal.status === "Won").length}</span>
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Status</th>
              <th>Value</th>
              <th>Assigned To</th>
              <th>Expected Close</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading deals...</td>
              </tr>
            ) : deals.length ? (
              deals.map((deal) => (
                <tr key={deal._id}>
                  <td style={{ fontWeight: "var(--font-semibold)" }}>{deal.name}</td>
                  <td>
                    <span className={`badge badge-${deal.status === "Won" ? "success" : deal.status === "Lost" ? "error" : "warning"}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td>Rs. {Number(deal.value || 0).toLocaleString("en-IN")}</td>
                  <td>
  {deal.assignedTo?.name || "Unassigned"}
</td>
                  <td>{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "--"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          setEditingId(deal._id);
                          setForm({
                            name: deal.name || "",
                            status: deal.status || "New",
                            value: deal.value || "",
                            assignedTo: deal.assignedTo?._id || "",
                            expectedCloseDate: deal.expectedCloseDate ? String(deal.expectedCloseDate).substring(0, 10) : "",
                          });
                          setShowModal(true);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => handleDelete(deal._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-8)" }}>No deals found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "420px" }}>
            <div className="nc-modal-header">
              <h3>{editingId ? "Edit Deal" : "Add Deal"}</h3>
            </div>

            <form onSubmit={handleSubmit} className="form">
              <div className="form-field">
                <label className="form-label">Deal Name</label>
                <input className="form-input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Deal Value</label>
                <input className="form-input" type="number" required value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Assigned To</label>
                <input className="form-input" required value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Expected Close Date</label>
                <input className="form-input" type="date" value={form.expectedCloseDate} onChange={(event) => setForm({ ...form, expectedCloseDate: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Deal</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Deals;
