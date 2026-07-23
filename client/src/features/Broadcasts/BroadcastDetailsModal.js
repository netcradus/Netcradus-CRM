import React, { useEffect, useState } from "react";
import { X, Calendar, User as UserIcon, Eye, CheckCircle2 } from "lucide-react";
import { broadcastApi, managerBroadcastApi } from "./broadcastApi";

const PRIORITY_THEMES = {
  normal: { bg: "rgba(156, 163, 175, 0.1)", text: "var(--text-secondary)", border: "rgba(156, 163, 175, 0.2)" },
  important: { bg: "rgba(245, 158, 11, 0.1)", text: "var(--warning)", border: "rgba(245, 158, 11, 0.2)" },
  urgent: { bg: "rgba(239, 68, 68, 0.1)", text: "var(--danger)", border: "rgba(239, 68, 68, 0.2)" }
};

export default function BroadcastDetailsModal({ isOpen, broadcastId, onClose, onMarkReadLocal, isManager = false }) {
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && broadcastId) {
      setLoading(true);
      setError("");
      const api = isManager ? managerBroadcastApi : broadcastApi;
      api.get(broadcastId)
        .then(async (res) => {
          setBroadcast(res.data?.data || null);

          // If the broadcast is active and not read yet, mark it as read on the backend
          const detail = res.data?.data;
          if (detail && !detail.isRead) {
            try {
              const markRes = await api.markRead(broadcastId);
              if (markRes.data?.success) {
                // Update local list state
                onMarkReadLocal(broadcastId, markRes.data.data.readCount);
                // Update local modal state
                setBroadcast(prev => prev ? { ...prev, isRead: true, readCount: markRes.data.data.readCount } : null);
              }
            } catch (err) {
              console.error("Failed to mark broadcast as read:", err);
            }
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Failed to load announcement details.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, broadcastId, isManager]);

  if (!isOpen) return null;

  const formatDate = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const theme = broadcast ? (PRIORITY_THEMES[broadcast.priority] || PRIORITY_THEMES.normal) : PRIORITY_THEMES.normal;

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: "550px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="nc-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
          <div style={{ paddingRight: "var(--space-4)" }}>
            {broadcast && (
              <span style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "var(--font-size-xs)",
                fontWeight: "var(--font-semibold)",
                backgroundColor: theme.bg,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                marginBottom: "var(--space-2)",
                textTransform: "uppercase"
              }}>
                {broadcast.priority}
              </span>
            )}
            <h3 style={{ margin: 0, fontSize: "var(--font-size-lg)", color: "var(--text-primary)" }}>
              {loading ? "Loading..." : broadcast?.title || "Notice Details"}
            </h3>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ minWidth: "32px", minHeight: "32px", padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-6) 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Loading content...
          </div>
        ) : error ? (
          <div style={{ padding: "var(--space-4) 0", color: "var(--danger)", fontSize: "var(--font-size-sm)" }}>
            {error}
          </div>
        ) : broadcast ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            
            {/* Meta Section */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <UserIcon size={14} />
                <span>{broadcast.author?.name} <span style={{ opacity: 0.8 }}>({broadcast.author?.role})</span></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={14} />
                <span>{formatDate(broadcast.publishedAt)}</span>
              </div>
              {broadcast.isRead !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={14} color={broadcast.isRead ? "var(--success)" : "var(--text-secondary)"} />
                  <span>{broadcast.isRead ? "Read" : "Unread"}</span>
                </div>
              )}
            </div>

            {/* Content Body */}
            <div style={{ 
              fontSize: "var(--font-size-sm)", 
              lineHeight: 1.6, 
              color: "var(--text-primary)", 
              whiteSpace: "pre-wrap", 
              wordBreak: "break-word",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              padding: "var(--space-3)",
              borderRadius: "var(--border-radius-md)",
              border: "1px solid var(--border-color)"
            }}>
              {broadcast.content}
            </div>

            {/* Author Metrics Panel */}
            {broadcast.totalRecipients !== undefined && (
              <div style={{ 
                marginTop: "var(--space-2)", 
                padding: "var(--space-3)", 
                borderRadius: "var(--border-radius-md)", 
                backgroundColor: "rgba(59, 130, 246, 0.05)", 
                border: "1px solid rgba(59, 130, 246, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "var(--font-size-xs)", fontWeight: "var(--font-semibold)", color: "var(--primary)", textTransform: "uppercase" }}>
                  <Eye size={14} />
                  <span>Publishing & Audit Summary</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-2)", textAlign: "center", marginTop: "var(--space-1)" }}>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "var(--space-2)", borderRadius: "var(--border-radius-sm)" }}>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>Recipients</div>
                    <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-semibold)" }}>{broadcast.totalRecipients}</div>
                  </div>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "var(--space-2)", borderRadius: "var(--border-radius-sm)" }}>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>Read</div>
                    <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-semibold)", color: "var(--success)" }}>{broadcast.readCount}</div>
                  </div>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "var(--space-2)", borderRadius: "var(--border-radius-sm)" }}>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>Unread</div>
                    <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-semibold)", color: "var(--warning)" }}>
                      {Math.max(broadcast.totalRecipients - broadcast.readCount, 0)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Targeting Mode: <span style={{ textTransform: "capitalize", fontWeight: "var(--font-semibold)" }}>{broadcast.targetType?.replace("_", " ")}</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
              <button type="button" className="btn btn-primary" onClick={onClose} style={{ minWidth: "100px" }}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
