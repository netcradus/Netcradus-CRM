import React, { useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";

const prettify = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const priorityBadge = (priority) => {
  if (priority === "high" || priority === "urgent") return "error";
  if (priority === "medium") return "warning";
  return "info";
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "No due date";

const timeAgo = (value) => {
  if (!value) return "recently";
  const diffMinutes = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60000), 0);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export default function PendingApprovalsView({ tasks, loading, onApprove, onReject }) {
  const [activeTaskId, setActiveTaskId] = useState("");
  const [mode, setMode] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openAction = (taskId, nextMode) => {
    setActiveTaskId(taskId);
    setMode(nextMode);
    setNote("");
  };

  const closeAction = () => {
    setActiveTaskId("");
    setMode("");
    setNote("");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="nc-card" style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
        Loading approvals...
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="nc-card" style={{ padding: "var(--space-10)", textAlign: "center" }}>
        <Clock size={28} style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }} />
        <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>No tasks pending your approval</h3>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-muted)" }}>
          Your team members' self tasks will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {tasks.map((task) => {
        const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now();
        const isActive = activeTaskId === task._id;
        const rejectDisabled = mode === "reject" && note.trim().length < 10;

        return (
          <div key={task._id} className="nc-card" style={{ padding: "var(--space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--color-primary-muted)",
                      color: "var(--color-primary)",
                      fontWeight: "var(--font-bold)",
                    }}
                  >
                    {(task.createdBy?.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: "var(--font-semibold)" }}>{task.createdBy?.name || "Employee"}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {prettify(task.createdBy?.role)} {task.createdBy?.department ? `- ${task.createdBy.department}` : ""}
                    </div>
                  </div>
                </div>
                <h3 style={{ margin: "var(--space-4) 0 var(--space-1)", fontSize: "var(--text-base)" }}>{task.title}</h3>
                <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                  {(task.description || "No description").slice(0, 180)}
                  {(task.description || "").length > 180 ? "..." : ""}
                </p>
              </div>
              <span className={`badge badge-${priorityBadge(task.priority)}`}>{prettify(task.priority)}</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "var(--space-3)",
                marginTop: "var(--space-4)",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              <span>Due: {formatDate(task.dueDate)} {isOverdue ? "(overdue)" : ""}</span>
              <span>Submitted: {timeAgo(task.submittedForApprovalAt)}</span>
              <span>Estimated: {task.estimatedHours ? `${task.estimatedHours} hours` : "Not set"}</span>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary" onClick={() => openAction(task._id, "approve")}>
                <CheckCircle size={16} /> Approve
              </button>
              <button type="button" className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => openAction(task._id, "reject")}>
                <XCircle size={16} /> Reject
              </button>
            </div>

            {isActive ? (
              <div style={{ marginTop: "var(--space-4)", display: "grid", gap: "var(--space-3)" }}>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={mode === "approve" ? "Add a note for the employee (optional)" : "Explain why this task is being rejected (min 10 characters)"}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={submitting || rejectDisabled}
                    onClick={async () => {
                      try {
                        setSubmitting(true);
                        if (mode === "approve") await onApprove(task, note);
                        if (mode === "reject") await onReject(task, note);
                        closeAction();
                      } catch {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {submitting ? "Saving..." : mode === "approve" ? "Approve Task" : "Reject Task"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={closeAction} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
