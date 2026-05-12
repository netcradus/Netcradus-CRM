import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Eye, Megaphone, Plus, Search, Trash2 } from "lucide-react";
import { dmApi, formatCurrency, formatDate, formatDateTime } from "../DigitalMedia/api";

const emptyForm = {
  name: "",
  channel: "",
  status: "Active",
  startDate: "",
  endDate: "",
  budgetAllocated: "",
  budgetSpent: "",
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [detailForm, setDetailForm] = useState(emptyForm);

  const fetchCampaigns = async () => {
    try {
      const { data } = await dmApi.get("/api/campaigns");
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesTab = filter === "All" || campaign.status === filter;
      const matchesSearch = campaign.name?.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [campaigns, filter, search]);

  const openCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setDetailForm({
      name: campaign.name || "",
      channel: campaign.channel || "",
      status: campaign.status || "Active",
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 10) : "",
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 10) : "",
      budgetAllocated: campaign.budgetAllocated || 0,
      budgetSpent: campaign.budgetSpent || 0,
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    await dmApi.post("/api/campaigns", {
      ...form,
      budgetAllocated: Number(form.budgetAllocated) || 0,
      budgetSpent: Number(form.budgetSpent) || 0,
    });
    setShowCreateModal(false);
    setForm(emptyForm);
    fetchCampaigns();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this campaign?")) {
      return;
    }

    await dmApi.delete(`/api/campaigns/${id}`);
    if (selectedCampaign?._id === id) {
      setSelectedCampaign(null);
    }
    fetchCampaigns();
  };

  const saveDetails = async () => {
    await dmApi.put(`/api/campaigns/${selectedCampaign._id}`, {
      ...detailForm,
      budgetAllocated: Number(detailForm.budgetAllocated) || 0,
      budgetSpent: Number(detailForm.budgetSpent) || 0,
    });
    await dmApi.patch(`/api/campaigns/${selectedCampaign._id}/budget`, {
      budgetAllocated: Number(detailForm.budgetAllocated) || 0,
      budgetSpent: Number(detailForm.budgetSpent) || 0,
    });
    fetchCampaigns();
  };

  const submitForReview = async () => {
    await dmApi.post(`/api/campaigns/${selectedCampaign._id}/submit-for-review`);
    fetchCampaigns();
  };

  const remainingBudget = Number(detailForm.budgetAllocated || 0) - Number(detailForm.budgetSpent || 0);
  const spendPercentage = Number(detailForm.budgetAllocated || 0) > 0
    ? Math.round((Number(detailForm.budgetSpent || 0) / Number(detailForm.budgetAllocated || 0)) * 100)
    : 0;

  const selectedCampaignFresh = campaigns.find((campaign) => campaign._id === selectedCampaign?._id) || selectedCampaign;

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Marketing</span><ChevronRight size={10} /><span>Campaigns</span>
          </div>
          <h1 className="title">Marketing Campaigns</h1>
          <p className="subtitle">Track, budget, and submit multi-channel campaigns for review.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={16} /> New Campaign</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div className="nc-stat-card"><span className="metric-label">Total Active</span><span className="metric-value">{campaigns.filter((campaign) => campaign.status === "Active").length}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Channels</span><span className="metric-value">{new Set(campaigns.map((campaign) => campaign.channel)).size}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Budget Allocated</span><span className="metric-value">{formatCurrency(campaigns.reduce((sum, campaign) => sum + (Number(campaign.budgetAllocated) || 0), 0))}</span></div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {["All", "Active", "Paused"].map((tab) => (
            <button key={tab} className={`btn ${filter === tab ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(tab)} style={{ height: "32px" }}>{tab}</button>
          ))}
        </div>
        <div style={{ position: "relative", width: 240 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 36, height: "32px" }} placeholder="Search campaigns..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Approval</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((campaign) => (
              <tr key={campaign._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-bg-elevated)", display: "grid", placeItems: "center" }}>
                      <Megaphone size={14} color="var(--color-accent)" />
                    </div>
                    <span style={{ fontWeight: "var(--font-semibold)" }}>{campaign.name}</span>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{campaign.channel}</span></td>
                <td><span className={`badge ${campaign.status === "Active" ? "badge-success" : "badge-warning"}`}>{campaign.status}</span></td>
                <td>{formatCurrency(campaign.budgetSpent || 0)} / {formatCurrency(campaign.budgetAllocated || 0)}</td>
                <td><span className={`badge ${campaign.approvalStatus === "approved" ? "badge-success" : campaign.approvalStatus === "rejected" ? "badge-danger" : campaign.approvalStatus === "pending_review" ? "badge-warning" : "badge-neutral"}`}>{campaign.approvalStatus || "draft"}</span></td>
                <td>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" onClick={() => openCampaign(campaign)}><Eye size={14} /></button>
                    <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => handleDelete(campaign._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No campaigns found</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="nc-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 460 }}>
            <div className="nc-modal-header"><h3>New Campaign</h3></div>
            <form onSubmit={handleCreate} style={{ display: "grid", gap: "var(--space-4)" }}>
              <input className="form-input" required placeholder="Campaign Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <select className="form-select" required value={form.channel} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}>
                <option value="">Select Channel...</option>
                <option value="Email">Email</option>
                <option value="Social Media">Social Media</option>
                <option value="PPC">PPC</option>
                <option value="Direct Mail">Direct Mail</option>
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <input className="form-input" type="date" required value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
                <input className="form-input" type="date" required value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <input className="form-input" type="number" placeholder="Allocated Budget" value={form.budgetAllocated} onChange={(event) => setForm((current) => ({ ...current, budgetAllocated: event.target.value }))} />
                <input className="form-input" type="number" placeholder="Spent Budget" value={form.budgetSpent} onChange={(event) => setForm((current) => ({ ...current, budgetSpent: event.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary">Create Campaign</button>
            </form>
          </div>
        </div>
      )}

      {selectedCampaignFresh && (
        <div className="nc-modal-overlay" onClick={() => setSelectedCampaign(null)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "min(760px, 92vw)" }}>
            <div className="nc-modal-header">
              <h3>{selectedCampaignFresh.name}</h3>
            </div>
            <div style={{ display: "grid", gap: "var(--space-5)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
                <input className="form-input" value={detailForm.name} onChange={(event) => setDetailForm((current) => ({ ...current, name: event.target.value }))} />
                <select className="form-select" value={detailForm.channel} onChange={(event) => setDetailForm((current) => ({ ...current, channel: event.target.value }))}>
                  <option value="Email">Email</option>
                  <option value="Social Media">Social Media</option>
                  <option value="PPC">PPC</option>
                  <option value="Direct Mail">Direct Mail</option>
                </select>
                <select className="form-select" value={detailForm.status} onChange={(event) => setDetailForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                </select>
                <input className="form-input" type="date" value={detailForm.startDate} onChange={(event) => setDetailForm((current) => ({ ...current, startDate: event.target.value }))} />
                <input className="form-input" type="date" value={detailForm.endDate} onChange={(event) => setDetailForm((current) => ({ ...current, endDate: event.target.value }))} />
              </div>

              <div className="nc-card" style={{ background: "var(--color-bg-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  <h4 style={{ fontSize: "var(--text-base)" }}>Budget</h4>
                  <span className={`badge ${spendPercentage > 100 ? "badge-danger" : spendPercentage > 90 ? "badge-warning" : "badge-success"}`}>
                    {spendPercentage}%
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                  <div>
                    <label className="form-label">Allocated Budget</label>
                    <input className="form-input" type="number" value={detailForm.budgetAllocated} onChange={(event) => setDetailForm((current) => ({ ...current, budgetAllocated: event.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Spent So Far</label>
                    <input className="form-input" type="number" value={detailForm.budgetSpent} onChange={(event) => setDetailForm((current) => ({ ...current, budgetSpent: event.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Remaining</label>
                    <div className="form-input" style={{ display: "flex", alignItems: "center" }}>{formatCurrency(remainingBudget)}</div>
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "var(--color-bg-tertiary)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(spendPercentage, 100)}%`,
                      height: "100%",
                      background: spendPercentage > 100 ? "var(--color-error)" : spendPercentage > 90 ? "var(--color-warning)" : "var(--color-success)",
                    }}
                  />
                </div>
              </div>

              <div className="nc-card" style={{ background: "var(--color-bg-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: "var(--font-semibold)", marginBottom: "4px" }}>Approval Workflow</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      Status: {selectedCampaignFresh.approvalStatus || "draft"} · Last updated {formatDateTime(selectedCampaignFresh.updatedAt)}
                    </div>
                  </div>
                  {(selectedCampaignFresh.approvalStatus === "draft" || selectedCampaignFresh.approvalStatus === "rejected") && (
                    <button className="btn btn-primary" onClick={submitForReview}>Submit for Review</button>
                  )}
                </div>
                {selectedCampaignFresh.approvalReason && (
                  <div style={{ marginTop: "var(--space-3)", color: "var(--color-error)", fontSize: "12px" }}>
                    Rejection reason: {selectedCampaignFresh.approvalReason}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={saveDetails}>Save Changes</button>
                <button className="btn btn-ghost" onClick={() => setSelectedCampaign(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
