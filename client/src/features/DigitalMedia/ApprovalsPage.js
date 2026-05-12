import React, { useEffect, useMemo, useState } from "react";
import ApprovalQueueWidget from "./ApprovalQueueWidget";
import { dmApi, formatDateTime, isApproverRole, truncate } from "./api";

const ApprovalsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [posts, setPosts] = useState([]);

  const loadSubmissions = async () => {
    const [campaignsRes, postsRes] = await Promise.all([
      dmApi.get("/api/campaigns"),
      dmApi.get("/api/social/posts"),
    ]);

    setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
    setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const submissions = useMemo(
    () =>
      [
        ...campaigns.map((campaign) => ({
          _id: campaign._id,
          itemType: "campaign",
          preview: campaign.name,
          approvalStatus: campaign.approvalStatus,
          approvalReason: campaign.approvalReason,
          updatedAt: campaign.updatedAt,
        })),
        ...posts.map((post) => ({
          _id: post._id,
          itemType: "post",
          preview: post.content,
          approvalStatus: post.approvalStatus,
          approvalReason: post.approvalReason,
          updatedAt: post.updatedAt,
        })),
      ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [campaigns, posts]
  );

  const handleResubmit = async (item) => {
    const base = item.itemType === "campaign" ? "/api/campaigns" : "/api/social/posts";
    await dmApi.post(`${base}/${item._id}/submit-for-review`);
    loadSubmissions();
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Approvals</h1>
          <p className="subtitle">Track review state for your campaigns and social posts, with queue visibility for approvers.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isApproverRole() ? "1.2fr 1fr" : "1fr", gap: "var(--space-6)" }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>My Submissions</h3>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {submissions.map((item) => (
              <div key={`${item.itemType}-${item._id}`} style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: "var(--font-semibold)" }}>{item.itemType === "campaign" ? "Campaign" : "Social Post"}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{formatDateTime(item.updatedAt)}</div>
                  </div>
                  <span className={`badge ${item.approvalStatus === "approved" ? "badge-success" : item.approvalStatus === "rejected" ? "badge-danger" : item.approvalStatus === "pending_review" ? "badge-warning" : "badge-neutral"}`}>
                    {item.approvalStatus}
                  </span>
                </div>
                <div style={{ marginBottom: "var(--space-2)" }}>{truncate(item.preview, 100)}</div>
                {item.approvalReason && (
                  <div style={{ fontSize: "12px", color: "var(--color-error)", marginBottom: "var(--space-3)" }}>
                    Rejection reason: {item.approvalReason}
                  </div>
                )}
                {(item.approvalStatus === "draft" || item.approvalStatus === "rejected") && (
                  <button className="btn btn-primary" onClick={() => handleResubmit(item)}>Submit for Review</button>
                )}
              </div>
            ))}
            {submissions.length === 0 && (
              <div style={{ color: "var(--color-text-muted)" }}>No submitted items yet.</div>
            )}
          </div>
        </div>

        {isApproverRole() && <ApprovalQueueWidget />}
      </div>
    </div>
  );
};

export default ApprovalsPage;
