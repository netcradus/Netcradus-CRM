import React from "react";

function ReassignModal({ pending, onCancel, onConfirm, submitting }) {
  if (!pending) return null;

  return (
    <div
      className="nc-modal-overlay"
      onClick={onCancel}
    >
      <div
        className="nc-modal-content"
        style={{ maxWidth: 520, width: "100%" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nc-modal-header"><h3>Reassign Reporting Line</h3></div>
        <div className="form">
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            Reassign {pending.draggedName} to report to {pending.targetName}? Their level will be updated to{" "}
            {pending.newPriorityLevel}.
          </p>
        </div>
        <div className="nc-modal-footer" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReassignModal;
