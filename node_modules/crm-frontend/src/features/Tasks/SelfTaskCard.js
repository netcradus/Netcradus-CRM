import React from "react";
import { CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";
import ApprovalHistoryPanel from "./ApprovalHistoryPanel";

const statusMeta = {
  draft: { label: "Draft", badge: "ghost" },
  pending_approval: { label: "Awaiting Approval", badge: "warning" },
  approved: { label: "Approved", badge: "success" },
  rejected: { label: "Rejected", badge: "error" },
  revision: { label: "Revision", badge: "warning" },
  changes_requested: { label: "Rework Required", badge: "warning" },
  rework_required: { label: "Rework Required", badge: "warning" },
};

const prettify = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "No due date";

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

const priorityBadge = (priority) => {
  if (priority === "high" || priority === "urgent") return "error";
  if (priority === "medium") return "warning";
  return "info";
};

export default function SelfTaskCard({ task, onSubmitForApproval, onEdit, onDelete }) {
  const latestApprovalAction = task.approvalHistory && task.approvalHistory.length > 0
    ? task.approvalHistory[task.approvalHistory.length - 1].action
    : "";

  const isReworkRequired =
    task.selfTaskStatus === "rework_required" ||
    task.selfTaskStatus === "changes_requested" ||
    latestApprovalAction === "rework_required" ||
    latestApprovalAction === "changes_requested";

  const meta = statusMeta[task.selfTaskStatus] || statusMeta.draft;
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.selfTaskStatus !== "approved";
  const revisionText = task.revisionCount > 0 ? `Revision ${task.revisionCount}` : null;
  const reworkEntry = isReworkRequired
    ? [...(task.approvalHistory || [])].reverse().find(h => h.action === "rework_required" || h.action === "changes_requested")
    : null;

  return (
    <div className="nc-card" style={{ padding: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)" }}>{task.title}</h3>
            <span className={`badge badge-${meta.badge}`}>{meta.label}</span>
            <span className={`badge badge-${priorityBadge(task.priority)}`}>{prettify(task.priority)}</span>
            {revisionText ? <span className="badge badge-warning">{revisionText}</span> : null}
            {isOverdue ? <span className="badge badge-error">Overdue</span> : null}
          </div>
          <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            {task.description || "No description"}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-3)",
          marginTop: "var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
        }}
      >
        <span>Due: {formatDate(task.dueDate)}</span>
        <span>Estimated: {task.estimatedHours ? `${task.estimatedHours}h` : "Not set"}</span>
        <span>Work status: {isReworkRequired ? "Rework Required" : prettify(task.status)}</span>
      </div>

      {task.selfTaskStatus === "pending_approval" ? (
        <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)", alignItems: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          <Clock size={14} />
          Awaiting approval from your manager
        </div>
      ) : null}

      {isReworkRequired && reworkEntry ? (
        <div
          style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-3)",
            border: "1px solid var(--color-warning)",
            background: "rgba(245, 158, 11, 0.05)",
            color: "var(--color-text-primary)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
          }}
        >
          <div style={{ fontWeight: "var(--font-bold)", color: "var(--color-warning)", marginBottom: "var(--space-1)" }}>
            Rework Required
          </div>
          <div style={{ whiteSpace: "pre-wrap", marginBottom: "var(--space-2)" }}>
            Remarks from {reworkEntry.performedBy?.name || "Reviewer"}: "{reworkEntry.note || reworkEntry.remarks || "No remarks provided"}"
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
            Sent back by: {reworkEntry.performedBy?.name || "Reviewer"} {reworkEntry.performedBy?.role ? `(${prettify(reworkEntry.performedBy.role)})` : ""}
            <br />
            Sent back on: {formatDateTime(reworkEntry.performedAt)}
          </div>
          <div style={{ fontStyle: "italic", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2)" }}>
            Please complete the requested improvements and resubmit this task for approval.
          </div>
        </div>
      ) : null}

      {task.selfTaskStatus === "rejected" ? (
        <div
          style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-3)",
            border: "1px solid var(--color-error)",
            background: "var(--color-error-muted)",
            color: "var(--color-error)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
          }}
        >
          Rejected: {task.rejectionReason}
        </div>
      ) : null}

      {task.selfTaskStatus === "approved" ? (
        <div style={{ marginTop: "var(--space-4)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          Approved by {task.approvedBy?.name || "manager"} on {formatDateTime(task.approvedAt)}
          {task.approvalNote ? <div style={{ marginTop: "var(--space-1)" }}>{task.approvalNote}</div> : null}
        </div>
      ) : null}

      <ApprovalHistoryPanel history={task.approvalHistory || []} />

      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
        {["draft", "revision"].includes(task.selfTaskStatus) ? (
          <button type="button" className="btn btn-primary" onClick={() => onSubmitForApproval(task)}>
            <CheckCircle2 size={16} /> Submit for Approval
          </button>
        ) : null}
        {isReworkRequired ? (
          <>
            <button type="button" className="btn btn-primary" onClick={() => onSubmitForApproval(task)}>
              <CheckCircle2 size={16} /> Resubmit for Approval
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onEdit(task)}>
              <Pencil size={16} /> Update Task
            </button>
          </>
        ) : null}
        {task.selfTaskStatus === "rejected" ? (
          <button type="button" className="btn btn-primary" onClick={() => onEdit(task)}>
            <Pencil size={16} /> Revise and Resubmit
          </button>
        ) : null}
        {["draft", "rejected"].includes(task.selfTaskStatus) ? (
          <button type="button" className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => onDelete(task)}>
            <Trash2 size={16} /> Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
