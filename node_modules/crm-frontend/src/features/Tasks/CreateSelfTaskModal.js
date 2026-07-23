import React, { useMemo, useState } from "react";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  estimatedHours: "",
};

const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const prettify = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function CreateSelfTaskModal({
  initialTask = null,
  priorityOptions,
  saving,
  onClose,
  onSubmit,
}) {
  const initialForm = useMemo(() => {
    if (!initialTask) return EMPTY_FORM;
    return {
      title: initialTask.title || "",
      description: initialTask.description || "",
      priority: initialTask.priority || "medium",
      dueDate: toDateTimeInput(initialTask.dueDate),
      estimatedHours: initialTask.estimatedHours || "",
    };
  }, [initialTask]);

  const [form, setForm] = useState(initialForm);
  const descriptionLength = form.description.length;

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      estimatedHours: form.estimatedHours === "" ? null : Number(form.estimatedHours),
    });
  };

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 560 }}>
        <div className="nc-modal-header">
          <h3>{initialTask ? "Revise Self Task" : "Log Self Task"}</h3>
        </div>

        <form className="form" onSubmit={submit} style={{ padding: "var(--space-4)" }}>
          <div
            className="badge badge-warning"
            style={{
              display: "block",
              width: "100%",
              padding: "var(--space-3) var(--space-4)",
              marginBottom: "var(--space-4)",
              whiteSpace: "normal",
              lineHeight: 1.5,
            }}
          >
            Self tasks require approval from your manager before they are counted. Complete the task first, then submit it for approval.
          </div>

          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              required
              maxLength={200}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <div style={{ textAlign: "right", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {descriptionLength}/2000
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div className="form-field">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {prettify(option)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Estimated Hours</label>
              <input
                className="form-input"
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={(event) => setForm({ ...form, estimatedHours: event.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Due Date</label>
            <input
              className="form-input"
              type="datetime-local"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? "Saving..." : initialTask ? "Save Revision" : "Create Self Task"}
            </button>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
