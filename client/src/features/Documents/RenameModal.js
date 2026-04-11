import React, { useState } from "react";
import { X } from "lucide-react";

const RenameModal = ({ currentName, onSubmit, onClose }) => {
  const [name, setName] = useState(currentName);
  return (
    <div className="drive-modal-overlay" onClick={onClose}>
      <div className="drive-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <button className="drive-modal-close" onClick={onClose}><X size={18} /></button>
        <h3>✏️ Rename File</h3>
        <p>Enter a new display name for this file.</p>
        <input
          className="drive-modal-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && onSubmit(name.trim())}
          autoFocus
          maxLength={200}
        />
        <div className="drive-modal-actions">
          <button className="drive-btn drive-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="drive-btn drive-btn-primary" disabled={!name.trim() || name.trim() === currentName} onClick={() => onSubmit(name.trim())}>
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;
