import React, { useState } from "react";
import { X } from "lucide-react";

const MoveModal = ({ currentFolderId, storage, onSubmit, onClose }) => {
  const [selected, setSelected] = useState("");
  const folders = (storage?.subFolders || []).filter(f => f.driveFolderId !== currentFolderId);

  return (
    <div className="drive-modal-overlay" onClick={onClose}>
      <div className="drive-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <button className="drive-modal-close" onClick={onClose}><X size={18} /></button>
        <h3>📂 Move File</h3>
        <p>Choose a destination folder.</p>
        <select
          className="drive-modal-input"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">Select folder…</option>
          {folders.map(f => (
            <option key={f.driveFolderId} value={f.driveFolderId}>{f.name}</option>
          ))}
        </select>
        <div className="drive-modal-actions">
          <button className="drive-btn drive-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="drive-btn drive-btn-primary"
            disabled={!selected}
            onClick={() => {
              const folder = folders.find(f => f.driveFolderId === selected);
              onSubmit(selected, folder?.name);
            }}
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
