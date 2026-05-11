import React, { useEffect, useState } from "react";

function AddToHierarchyModal({ user, hierarchy, onClose, onSubmit, submitting }) {
  const rootNode = hierarchy.find((entry) => Number(entry.priorityLevel || 0) === 0) || hierarchy[0];
  const [form, setForm] = useState({
    priorityLevel: 1,
    parentId: "",
  });

  useEffect(() => {
    if (!user) return;
    const isRootUser = user.role === "super_user";
    setForm({
      priorityLevel: isRootUser ? 0 : Number(rootNode?.priorityLevel || 0) + 1,
      parentId: isRootUser ? "" : rootNode?._id || "",
    });
  }, [rootNode?._id, rootNode?.priorityLevel, user]);

  if (!user) return null;

  return (
    <div
      className="nc-modal-overlay"
      onClick={onClose}
    >
      <div
        className="nc-modal-content"
        style={{ maxWidth: 540, width: "100%" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nc-modal-header"><h3>Add to Hierarchy</h3></div>

        <div className="form" style={{ display: "grid", gap: 12 }}>
          <div className="form-field">
            <label className="form-label">Employee</label>
            <input className="form-input" value={user.name || ""} readOnly />
          </div>
          <div className="form-field">
            <label className="form-label">Designation</label>
            <input className="form-input" value={user.designation || ""} readOnly placeholder="Designation" />
          </div>
          <div className="form-field">
            <label className="form-label">Reports To</label>
            <select
              className="form-select"
              value={form.parentId}
              onChange={(event) => {
                const parent = hierarchy.find((entry) => String(entry._id) === String(event.target.value));
                setForm((prev) => ({
                  ...prev,
                  parentId: event.target.value,
                  priorityLevel: parent ? Number(parent.priorityLevel || 0) + 1 : 0,
                }));
              }}
            >
              <option value="">None - Root Level</option>
              {hierarchy.map((entry) => (
                <option key={entry._id} value={entry._id}>
                  {entry.userId?.name || "Unknown"} - Level {entry.priorityLevel}
                </option>
              ))}
            </select>
          </div>
          <div className="badge badge-ghost" style={{ justifyContent: "flex-start", padding: "var(--space-2) var(--space-3)" }}>
            This employee will be placed below the selected reporting manager on the canvas.
          </div>
        </div>

        <div className="nc-modal-footer" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              onSubmit({
                userId: user._id,
                priorityLevel: Number(form.priorityLevel),
                parentId: form.parentId || null,
                positionX: 0,
                positionY: 0,
              })
            }
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddToHierarchyModal;
