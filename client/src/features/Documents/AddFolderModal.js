import React, { useState } from "react";
import { X } from "lucide-react";

const AddFolderModal = ({ existingFolders, onSubmit, onClose }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clean = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const validate = () => {
    if (!clean) return "Folder name must contain at least one letter or number.";
    if (clean.length > 50) return "Folder name cannot exceed 50 characters.";
    if (existingFolders.includes(clean)) return `A folder named "${clean}" already exists.`;
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit(clean);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create folder.");
      setLoading(false);
    }
  };

  return (
    <div className="drive-modal-overlay" onClick={onClose}>
      <div className="drive-modal" onClick={e => e.stopPropagation()}>
        <button className="drive-modal-close" onClick={onClose}><X size={18} /></button>
        <h3>📂 Create New Folder</h3>
        <p>Use letters, numbers, and hyphens only. Max 50 characters.</p>
        <input
          className="drive-modal-input"
          type="text"
          placeholder="e.g. my-reports"
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          autoFocus
          maxLength={60}
        />
        {clean && name !== clean && (
          <p style={{ fontSize: "0.75rem", color: "var(--nc-text-muted)", marginBottom: 8 }}>
            Will be saved as: <strong>{clean}</strong>
          </p>
        )}
        {error && <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: 10 }}>{error}</p>}
        <div className="drive-modal-actions">
          <button className="drive-btn drive-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="drive-btn drive-btn-primary" onClick={handleSubmit} disabled={loading || !clean}>
            {loading ? "Creating…" : "Create Folder"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFolderModal;
