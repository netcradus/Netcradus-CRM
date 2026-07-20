import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, XCircle, X } from "lucide-react";
import axios from "axios";

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

const timeAgo = (value) => {
  if (!value) return "recently";
  const diffMinutes = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60000), 0);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export default function PendingApprovalsView({ tasks, loading, onApprove, onReject, onRequestChanges, headers, apiUrl }) {
  const [activeTaskId, setActiveTaskId] = useState("");
  const [mode, setMode] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal State
  const [viewingTask, setViewingTask] = useState(null);
  const [modalMode, setModalMode] = useState(""); // "", "approve", "reject", "request-changes"
  const [modalNote, setModalNote] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Reviewer Note Input State
  const [newReviewerNote, setNewReviewerNote] = useState("");
  const [savingReviewerNote, setSavingReviewerNote] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setViewingTask(null);
        setModalMode("");
        setModalNote("");
        setNewReviewerNote("");
      }
    };
    if (viewingTask) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [viewingTask]);

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

  const handleModalAction = async () => {
    try {
      setModalSubmitting(true);
      if (modalMode === "approve") await onApprove(viewingTask, modalNote);
      if (modalMode === "reject") await onReject(viewingTask, modalNote);
      if (modalMode === "request-changes") await onRequestChanges(viewingTask, modalNote);
      setViewingTask(null);
      setModalMode("");
      setModalNote("");
      setNewReviewerNote("");
      setModalSubmitting(false);
    } catch {
      setModalSubmitting(false);
    }
  };

  const handleAddReviewerNote = async () => {
    const trimmed = newReviewerNote.trim();
    if (!trimmed || trimmed.length > 1000) return;
    try {
      setSavingReviewerNote(true);
      const { data } = await axios.post(
        apiUrl(`/api/tasks/self/${viewingTask._id}/reviewer-note`),
        { note: trimmed },
        { headers }
      );
      if (data?.success) {
        setViewingTask(data.data);
        setNewReviewerNote("");
      }
    } catch (err) {
      console.error("Failed to add reviewer note:", err);
    } finally {
      setSavingReviewerNote(false);
    }
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
              <button type="button" className="btn btn-secondary" onClick={() => setViewingTask(task)}>
                View Details
              </button>
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

      {/* View Details Modal */}
      {viewingTask ? (
        <div className="nc-modal-overlay" onClick={() => { setViewingTask(null); setModalMode(""); setModalNote(""); }}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 600 }}>
            <div className="nc-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Task Details</h3>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "var(--space-2)", minWidth: "auto", border: "none" }}
                onClick={() => { setViewingTask(null); setModalMode(""); setModalNote(""); }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="nc-modal-body" style={{ display: "grid", gap: "var(--space-4)" }}>
              <div>
                <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-1)" }}>Task Title</label>
                <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-bold)", fontSize: "var(--text-lg)" }}>{viewingTask.title}</div>
              </div>

              <div>
                <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-1)" }}>Description</label>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap", background: "var(--color-bg-surface-dim)", padding: "var(--space-3)", borderRadius: "var(--space-2)", border: "1px solid var(--color-border)" }}>
                  {viewingTask.description || "Not provided"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Employee</label>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>{viewingTask.createdBy?.name || "Not provided"}</div>
                </div>
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Designation</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>{prettify(viewingTask.createdBy?.role) || "Not provided"}</div>
                </div>
                {viewingTask.createdBy?.department ? (
                  <div>
                    <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Department</label>
                    <div style={{ fontSize: "var(--text-sm)" }}>{viewingTask.createdBy.department}</div>
                  </div>
                ) : null}
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Priority</label>
                  <span className={`badge badge-${priorityBadge(viewingTask.priority)}`}>{prettify(viewingTask.priority)}</span>
                </div>
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Status</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>{prettify(viewingTask.status)}</div>
                </div>
                {viewingTask.selfTaskStatus ? (
                  <div>
                    <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Approval Status</label>
                    <div style={{ fontSize: "var(--text-sm)" }}>{prettify(viewingTask.selfTaskStatus)}</div>
                  </div>
                ) : null}
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Due Date</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>{formatDate(viewingTask.dueDate)}</div>
                </div>
                {viewingTask.estimatedHours ? (
                  <div>
                    <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Est. Hours</label>
                    <div style={{ fontSize: "var(--text-sm)" }}>{viewingTask.estimatedHours} hours</div>
                  </div>
                ) : null}
                {viewingTask.submittedForApprovalAt ? (
                  <div>
                    <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Submitted At</label>
                    <div style={{ fontSize: "var(--text-sm)" }}>{formatDateTime(viewingTask.submittedForApprovalAt)}</div>
                  </div>
                ) : null}
                {viewingTask.createdAt ? (
                  <div>
                    <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Created At</label>
                    <div style={{ fontSize: "var(--text-sm)" }}>{formatDateTime(viewingTask.createdAt)}</div>
                  </div>
                ) : null}
                {viewingTask.completionTime ? (
                  <div>
                    <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Completed At</label>
                    <div style={{ fontSize: "var(--text-sm)" }}>{formatDateTime(viewingTask.completionTime)}</div>
                  </div>
                ) : null}
              </div>

              {viewingTask.rejectionReason ? (
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-1)" }}>Previous Rejection Reason</label>
                  <div style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", background: "rgba(var(--color-error-rgb), 0.05)", padding: "var(--space-3)", borderRadius: "var(--space-2)", border: "1px solid var(--color-error)" }}>
                    {viewingTask.rejectionReason}
                  </div>
                </div>
              ) : null}

              {viewingTask.approvalNote ? (
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-1)" }}>Approval / Revision Notes</label>
                  <div style={{ color: "var(--color-text-primary)", fontSize: "var(--text-sm)", background: "var(--color-bg-surface-dim)", padding: "var(--space-3)", borderRadius: "var(--space-2)", border: "1px solid var(--color-border)" }}>
                    {viewingTask.approvalNote}
                  </div>
                </div>
              ) : null}

              {/* Approval History */}
              {viewingTask.approvalHistory && viewingTask.approvalHistory.length > 0 ? (
                <div>
                  <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-2)" }}>Approval History</label>
                  <div style={{ display: "grid", gap: "var(--space-2)", background: "var(--color-bg-surface-dim)", padding: "var(--space-3)", borderRadius: "var(--space-2)", border: "1px solid var(--color-border)", maxHeight: 150, overflowY: "auto" }}>
                    {viewingTask.approvalHistory.map((history, idx) => (
                      <div key={idx} style={{ fontSize: "var(--text-xs)", borderBottom: idx < viewingTask.approvalHistory.length - 1 ? "1px solid var(--color-border)" : "none", paddingBottom: idx < viewingTask.approvalHistory.length - 1 ? "var(--space-2)" : 0, marginBottom: idx < viewingTask.approvalHistory.length - 1 ? "var(--space-2)" : 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "var(--font-semibold)" }}>
                          <span>{prettify(history.action)}</span>
                          <span style={{ color: "var(--color-text-muted)" }}>{formatDateTime(history.performedAt)}</span>
                        </div>
                        <div style={{ color: "var(--color-text-secondary)", marginTop: "2px" }}>
                          By: {history.performedBy?.name || "Unknown"} ({prettify(history.performedBy?.role)})
                        </div>
                        {history.note ? (
                          <div style={{ fontStyle: "italic", marginTop: "2px", color: "var(--color-text-muted)" }}>
                            Note: "{history.note}"
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Reviewer Notes Section */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
                <label className="form-label" style={{ display: "block", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-2)", fontWeight: "var(--font-semibold)" }}>
                  Reviewer Notes
                </label>
                {viewingTask.reviewerNotes && viewingTask.reviewerNotes.length > 0 ? (
                  <div style={{ display: "grid", gap: "var(--space-2)", background: "var(--color-bg-surface-dim)", padding: "var(--space-3)", borderRadius: "var(--space-2)", border: "1px solid var(--color-border)", maxHeight: 150, overflowY: "auto", marginBottom: "var(--space-3)" }}>
                    {[...viewingTask.reviewerNotes].reverse().map((rNote, idx) => (
                      <div key={idx} style={{ fontSize: "var(--text-xs)", borderBottom: idx < viewingTask.reviewerNotes.length - 1 ? "1px solid var(--color-border)" : "none", paddingBottom: idx < viewingTask.reviewerNotes.length - 1 ? "var(--space-2)" : 0, marginBottom: idx < viewingTask.reviewerNotes.length - 1 ? "var(--space-2)" : 0 }}>
                        <div style={{ color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>{rNote.note}</div>
                        <div style={{ color: "var(--color-text-muted)", fontSize: "10px", marginTop: "2px" }}>
                          By: {rNote.addedBy?.name || "Reviewer"} {rNote.addedBy?.role ? `(${prettify(rNote.addedBy.role)})` : ""} - {formatDateTime(rNote.addedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontStyle: "italic", marginBottom: "var(--space-3)" }}>
                    No reviewer notes added yet.
                  </div>
                )}

                {viewingTask.selfTaskStatus === "pending_approval" ? (
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <textarea
                      className="form-input"
                      rows={3}
                      maxLength={1000}
                      placeholder="Write a note for the employee..."
                      value={newReviewerNote}
                      onChange={(e) => setNewReviewerNote(e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {newReviewerNote.length} / 1000 characters
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={savingReviewerNote || !newReviewerNote.trim()}
                        onClick={handleAddReviewerNote}
                        style={{ padding: "var(--space-2) var(--space-4)" }}
                      >
                        {savingReviewerNote ? "Adding..." : "Add Note"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Confirm Actions */}
              {modalMode ? (
                <div style={{ display: "grid", gap: "var(--space-2)", background: "var(--color-bg-surface-dim)", padding: "var(--space-3)", borderRadius: "var(--space-2)", border: "1px solid var(--color-border)" }}>
                  {modalMode === "request-changes" ? (
                    <label className="form-label" style={{ fontWeight: "var(--font-bold)", color: "var(--color-warning)", marginBottom: 0 }}>
                      Improvement Required
                    </label>
                  ) : null}
                  <textarea
                    className="form-input"
                    rows={3}
                    maxLength={1000}
                    placeholder={
                      modalMode === "approve"
                        ? "Add an optional approval note..."
                        : modalMode === "reject"
                        ? "Explain why this task is being rejected (min 10 characters)"
                        : "Explain what needs to be improved or corrected..."
                    }
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {modalNote.length} / 1000 characters
                    </span>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={
                          modalSubmitting ||
                          (modalMode === "reject" && modalNote.trim().length < 10) ||
                          (modalMode === "request-changes" && modalNote.trim().length < 10)
                        }
                        onClick={handleModalAction}
                        style={{
                          background: modalMode === "request-changes" ? "var(--color-warning)" : undefined,
                          borderColor: modalMode === "request-changes" ? "var(--color-warning)" : undefined
                        }}
                      >
                        {modalSubmitting
                          ? "Saving..."
                          : modalMode === "approve"
                          ? "Confirm Approve"
                          : modalMode === "reject"
                          ? "Confirm Reject"
                          : "Send Request"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => { setModalMode(""); setModalNote(""); }}
                        disabled={modalSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="nc-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", padding: "24px", borderTop: "1px solid var(--color-border)" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setViewingTask(null); setModalMode(""); setModalNote(""); setNewReviewerNote(""); }}
                disabled={modalSubmitting}
              >
                Close
              </button>
              {!modalMode ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { setModalMode("approve"); setModalNote(newReviewerNote); }}
                    disabled={modalSubmitting}
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ color: "var(--color-warning)" }}
                    onClick={() => { setModalMode("request-changes"); setModalNote(newReviewerNote); }}
                    disabled={modalSubmitting}
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ color: "var(--color-error)" }}
                    onClick={() => { setModalMode("reject"); setModalNote(newReviewerNote); }}
                    disabled={modalSubmitting}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
