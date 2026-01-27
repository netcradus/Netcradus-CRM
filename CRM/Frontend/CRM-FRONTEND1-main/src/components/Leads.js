import React, { useEffect, useState } from "react";
import "./Leads.css";

function Leads() {
  const [leads, setLeads] = useState([]); // All leads from backend
  const [loading, setLoading] = useState(true); // Loading state
  const [search, setSearch] = useState(""); // Search filter

  // ✅ Backend se data fetch karna
  useEffect(() => {
    fetch("http://localhost:5000/api/leads")
      .then((res) => res.json())
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching leads:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Search filter logic
  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.company.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="leads-container">
        <h3>Loading Leads...</h3>
      </div>
    );
  }

  return (
    <div className="leads-container">
      <h2 className="leads-heading">Leads</h2>

      {/* Actions: Add Lead button + Search */}
      <div className="leads-actions">
        <button
          className="btn-primary"
          onClick={() => alert("Add Lead feature coming soon 🚀")}
        >
          + Add Lead
        </button>
        <input
          className="search-bar"
          type="text"
          placeholder="Search Leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status Legend */}
      <div className="lead-status">
        <div className="status hot">Hot</div>
        <div className="status warm">Warm</div>
        <div className="status cold">Cold</div>
      </div>

      {/* Leads Table */}
      <div className="leads-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead, index) => (
                <tr key={lead._id}>
                  <td>{index + 1}</td>
                  <td>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.company}</td>
                  <td>
                    <span className={`badge ${lead.status.toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#999" }}>
                  No leads found 😢
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leads;
