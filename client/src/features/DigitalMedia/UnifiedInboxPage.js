import React, { useEffect, useMemo, useState } from "react";
import { dmApi, formatDateTime, truncate } from "./api";

const UnifiedInboxPage = () => {
  const [items, setItems] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});

  const loadInbox = async () => {
    const { data } = await dmApi.get("/api/social/inbox", {
      params: { platform: platformFilter, status: statusFilter },
    });
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadInbox();
  }, [platformFilter, statusFilter]);

  const platforms = useMemo(
    () => Array.from(new Set(items.map((item) => item.platform))).sort(),
    [items]
  );

  const openItem = async (item) => {
    setExpandedId((current) => (current === item._id ? null : item._id));
    if (item.status === "new") {
      await dmApi.patch(`/api/social/inbox/${item._id}/read`);
      loadInbox();
    }
  };

  const submitReply = async (item) => {
    const replyText = String(replyDrafts[item._id] || "").trim();
    if (!replyText) {
      return;
    }

    await dmApi.post(`/api/social/inbox/${item._id}/reply`, { replyText });
    setReplyDrafts((current) => ({ ...current, [item._id]: "" }));
    loadInbox();
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Unified Social Inbox</h1>
          <p className="subtitle">Review comments, mentions, and direct messages across connected channels.</p>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", display: "grid", gridTemplateColumns: "200px 200px", gap: "var(--space-4)" }}>
        <select className="form-select" value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
          <option value="all">All Platforms</option>
          {platforms.map((platform) => (
            <option key={platform} value={platform}>{platform}</option>
          ))}
        </select>
        <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {items.map((item) => (
          <div key={item._id} className="nc-card" onClick={() => openItem(item)} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span className="badge badge-neutral">{item.platform}</span>
                  {item.campaignId?.name && <span className="badge badge-warning">{item.campaignId.name}</span>}
                  <span className={`badge ${item.status === "replied" ? "badge-success" : item.status === "read" ? "badge-warning" : "badge-danger"}`}>{item.status}</span>
                </div>
                <div style={{ fontWeight: "var(--font-semibold)" }}>{item.senderName}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{truncate(item.message, expandedId === item._id ? 500 : 100)}</div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{formatDateTime(item.timestamp)}</div>
            </div>

            {expandedId === item._id && (
              <div style={{ marginTop: "var(--space-4)", display: "grid", gap: "var(--space-3)" }} onClick={(event) => event.stopPropagation()}>
                <div style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-secondary)" }}>
                  {item.message}
                </div>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Write a reply..."
                  value={replyDrafts[item._id] || ""}
                  onChange={(event) => setReplyDrafts((current) => ({ ...current, [item._id]: event.target.value }))}
                />
                <button className="btn btn-primary" style={{ width: "fit-content" }} onClick={() => submitReply(item)}>
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="nc-card" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            No inbox items found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedInboxPage;
