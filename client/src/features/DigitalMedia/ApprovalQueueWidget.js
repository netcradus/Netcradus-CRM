import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { dmApi, formatDateTime, truncate } from "./api";

const ApprovalQueueWidget = ({ compact = false, title = "Approval Queue" }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const { data } = await dmApi.get("/api/approval/queue");
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleApprove = async (item) => {
    const base = item.itemType === "campaign" ? "/api/campaigns" : "/api/social/posts";
    await dmApi.post(`${base}/${item._id}/approve`);
    loadQueue();
  };

  const handleReject = async (item) => {
    const approvalReason = window.prompt("Enter a rejection reason");
    if (!approvalReason) {
      return;
    }

    const base = item.itemType === "campaign" ? "/api/campaigns" : "/api/social/posts";
    await dmApi.post(`${base}/${item._id}/reject`, { approvalReason });
    loadQueue();
  };

  const visibleItems = compact ? items.slice(0, 5) : items;

  return (
    <div className="nc-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h3 style={{ fontSize: "var(--text-base)" }}>{title}</h3>
        <span className="badge badge-warning">{items.length} Pending</span>
      </div>

      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {visibleItems.map((item) => (
          <div
            key={`${item.itemType}-${item._id}`}
            style={{
              padding: "var(--space-4)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-secondary)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
              <div>
                <div style={{ fontWeight: "var(--font-semibold)", marginBottom: "4px" }}>{item.submitterName}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {item.itemType === "campaign" ? "Campaign" : "Social Post"} · {formatDateTime(item.submittedAt)}
                </div>
              </div>
              <span className="badge badge-warning">Pending Review</span>
            </div>
            <div style={{ fontSize: "13px", marginBottom: "var(--space-3)" }}>{truncate(item.preview, 90)}</div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-primary" style={{ height: "34px" }} onClick={() => handleApprove(item)}>
                <Check size={14} /> Approve
              </button>
              <button className="btn btn-ghost" style={{ height: "34px" }} onClick={() => handleReject(item)}>
                <X size={14} /> Reject
              </button>
            </div>
          </div>
        ))}

        {!loading && visibleItems.length === 0 && (
          <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)" }}>
            No pending approvals right now.
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueueWidget;
