import React, { useEffect, useMemo, useState } from "react";
import { dmApi, formatCurrency } from "./api";

const BudgetOverviewPage = () => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const loadCampaigns = async () => {
      const { data } = await dmApi.get("/api/campaigns");
      setCampaigns(Array.isArray(data) ? data : []);
    };

    loadCampaigns();
  }, []);

  const summary = useMemo(() => {
    const totalAllocated = campaigns.reduce((sum, campaign) => sum + (Number(campaign.budgetAllocated) || 0), 0);
    const totalSpent = campaigns.reduce((sum, campaign) => sum + (Number(campaign.budgetSpent) || 0), 0);
    return {
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
    };
  }, [campaigns]);

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Budget Overview</h1>
          <p className="subtitle">Track allocated, spent, and remaining budget across all visible campaigns.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="nc-stat-card"><span className="metric-label">Total Allocated</span><span className="metric-value">{formatCurrency(summary.totalAllocated)}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Total Spent</span><span className="metric-value">{formatCurrency(summary.totalSpent)}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Total Remaining</span><span className="metric-value">{formatCurrency(summary.totalRemaining)}</span></div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Channel</th>
              <th>Allocated</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Spend %</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const allocated = Number(campaign.budgetAllocated) || 0;
              const spent = Number(campaign.budgetSpent) || 0;
              const remaining = allocated - spent;
              const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
              return (
                <tr key={campaign._id}>
                  <td>{campaign.name}</td>
                  <td>{campaign.channel}</td>
                  <td>{formatCurrency(allocated)}</td>
                  <td>{formatCurrency(spent)}</td>
                  <td>{formatCurrency(remaining)}</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
            {campaigns.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No campaigns found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetOverviewPage;
