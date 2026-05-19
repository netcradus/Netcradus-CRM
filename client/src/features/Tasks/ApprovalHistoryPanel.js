import React, { useState } from "react";
import { CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";

const actionMeta = {
  submitted: { label: "Submitted", Icon: Clock, color: "var(--color-warning)" },
  approved: { label: "Approved", Icon: CheckCircle, color: "var(--color-success)" },
  rejected: { label: "Rejected", Icon: XCircle, color: "var(--color-error)" },
  revised: { label: "Revised", Icon: RefreshCw, color: "var(--color-warning)" },
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export default function ApprovalHistoryPanel({ history = [] }) {
  const [open, setOpen] = useState(false);

  if (!history.length) return null;

  return (
    <div style={{ marginTop: "var(--space-3)" }}>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-xs)" }}
        onClick={() => setOpen((value) => !value)}
      >
        Approval History
      </button>

      {open && (
        <div style={{ marginTop: "var(--space-2)", display: "grid", gap: "var(--space-2)" }}>
          {history.map((item, index) => {
            const meta = actionMeta[item.action] || actionMeta.submitted;
            const Icon = meta.Icon;
            return (
              <div key={`${item.action}-${item.performedAt}-${index}`} style={{ display: "flex", gap: "var(--space-2)" }}>
                <Icon size={14} style={{ color: meta.color, marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  <div>
                    <strong style={{ color: "var(--color-text-primary)" }}>{meta.label}</strong>
                    {" by "}
                    {item.performedBy?.name || "User"}
                    {" - "}
                    {formatDateTime(item.performedAt)}
                  </div>
                  {item.note ? (
                    <div style={{ marginTop: 2, whiteSpace: "pre-wrap" }}>"{item.note}"</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
