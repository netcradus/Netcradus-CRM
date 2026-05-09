import React, { useState } from "react";
import { X, Pencil } from "lucide-react";

const RenameModal = ({ currentName, onSubmit, onClose }) => {
  const [name, setName] = useState(currentName);
  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
        <div className="nc-modal-header">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Pencil size={18} color="var(--color-accent)" />
              <h3>Rename File</h3>
           </div>
        </div>
        
        <div className="form" style={{ marginTop: 'var(--space-4)' }}>
           <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Enter a new display name for this file.</p>
           
           <div className="form-field">
              <label className="form-label">File Name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && onSubmit(name.trim())}
                autoFocus
                maxLength={200}
              />
           </div>

           <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!name.trim() || name.trim() === currentName} onClick={() => onSubmit(name.trim())}>
                Rename File
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;
