import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Megaphone, Plus, Calendar, User, Eye, CheckCircle2 } from "lucide-react";
import { managerBroadcastApi } from "./broadcastApi";
import CreateManagerBroadcastModal from "./CreateManagerBroadcastModal";
import BroadcastDetailsModal from "./BroadcastDetailsModal";

const PRIORITY_BADGES = {
  normal: { bg: "rgba(156, 163, 175, 0.1)", text: "var(--text-secondary)", border: "rgba(156, 163, 175, 0.2)" },
  important: { bg: "rgba(245, 158, 11, 0.1)", text: "var(--warning)", border: "rgba(245, 158, 11, 0.2)" },
  urgent: { bg: "rgba(239, 68, 68, 0.1)", text: "var(--danger)", border: "rgba(239, 68, 68, 0.2)" }
};

export default function ManagerBroadcastsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");

  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await managerBroadcastApi.list();
      setBroadcasts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Open details modal if openId is parsed in URL query params
  useEffect(() => {
    if (openId) {
      setSelectedBroadcastId(openId);
    }
  }, [openId]);

  const handleMarkReadLocal = (id, nextReadCount) => {
    setBroadcasts(prev => prev.map(b => {
      if (b._id === id) {
        const updated = { ...b, isRead: true };
        if (b.readCount !== undefined) {
          updated.readCount = nextReadCount;
        }
        return updated;
      }
      return b;
    }));
  };

  const handleCloseDetails = () => {
    setSelectedBroadcastId(null);
    if (openId) {
      setSearchParams({});
    }
  };

  const formatDate = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="nc-page-container" style={{ padding: "var(--space-6)" }}>
      {/* Header section */}
      <div className="nc-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Megaphone size={24} className="text-primary" />
          <h2 style={{ margin: 0, fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-bold)" }}>Team Broadcasts</h2>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Plus size={16} />
          <span>Publish Announcement</span>
        </button>
      </div>

      {/* Main panel body */}
      {loading ? (
        <div style={{ padding: "var(--space-12) 0", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading announcements...
        </div>
      ) : error ? (
        <div style={{ padding: "var(--space-6)", color: "var(--danger)", textAlign: "center" }}>
          {error}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="nc-card" style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--text-secondary)" }}>
          <Megaphone size={48} style={{ opacity: 0.2, marginBottom: "var(--space-4)" }} />
          <h3>No team announcements yet</h3>
          <p style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--space-2)" }}>
            Publish your first team announcement or see notices sent to you here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-4)" }}>
          {broadcasts.map((b) => {
            const badgeTheme = PRIORITY_BADGES[b.priority] || PRIORITY_BADGES.normal;
            return (
              <div
                key={b._id}
                className="nc-card"
                onClick={() => setSelectedBroadcastId(b._id)}
                style={{
                  cursor: "pointer",
                  padding: "var(--space-4)",
                  position: "relative",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                  borderLeft: b.isRead ? "1px solid var(--border-color)" : "3px solid var(--primary)",
                  backgroundColor: b.isRead ? "rgba(255, 255, 255, 0.01)" : "rgba(59, 130, 246, 0.02)"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = b.isRead ? "var(--border-color)" : "var(--primary)"}
              >
                {/* Header card meta */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: "var(--font-semibold)",
                      backgroundColor: badgeTheme.bg,
                      color: badgeTheme.text,
                      border: `1px solid ${badgeTheme.border}`,
                      textTransform: "uppercase"
                    }}>
                      {b.priority}
                    </span>
                    {!b.isRead && (
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: "var(--font-semibold)",
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        color: "var(--primary)"
                      }}>
                        New
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} />
                    {formatDate(b.publishedAt)}
                  </span>
                </div>

                {/* Title & Preview */}
                <h4 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--font-size-md)", color: "var(--text-primary)", fontWeight: "var(--font-semibold)" }}>
                  {b.title}
                </h4>
                <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {b.contentPreview}
                </p>

                {/* Card footer metrics */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <User size={12} />
                    <span>{b.author?.name} <span style={{ opacity: 0.7 }}>({b.author?.role})</span></span>
                  </div>

                  {b.totalRecipients !== undefined && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Eye size={12} />
                        <span>Recipients: <strong>{b.totalRecipients}</strong></span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={12} color="var(--success)" />
                        <span>Read: <strong style={{ color: "var(--success)" }}>{b.readCount}</strong></span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <CreateManagerBroadcastModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPublishSuccess={fetchList}
      />

      {/* Details Modal */}
      <BroadcastDetailsModal
        isOpen={selectedBroadcastId !== null}
        broadcastId={selectedBroadcastId}
        onClose={handleCloseDetails}
        onMarkReadLocal={handleMarkReadLocal}
        isManager={true}
      />
    </div>
  );
}
