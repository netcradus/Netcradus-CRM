import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";

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
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
        <div className="nc-modal-header">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FolderPlus size={18} color="var(--color-accent)" />
              <h3>Create Folder</h3>
           </div>
        </div>
        
        <div className="form" style={{ marginTop: 'var(--space-4)' }}>
           <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Use letters, numbers, and hyphens only. Max 50 characters.</p>
           
           <div className="form-field">
              <label className="form-label">Folder Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. project-assets"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoFocus
                maxLength={60}
              />
              {clean && name !== clean && (
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: '4px' }}>
                  Preview: <span style={{ color: 'var(--color-accent)', fontWeight: 'var(--font-semibold)' }}>{clean}</span>
                </div>
              )}
              {error && <div className="form-error">{error}</div>}
           </div>

           <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading || !clean}>
                {loading ? "Creating..." : "Create Folder"}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancel</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AddFolderModal;
