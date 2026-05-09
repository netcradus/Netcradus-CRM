import React, { useState } from "react";
import { X, FolderInput } from "lucide-react";

const MoveModal = ({ currentFolderId, storage, onSubmit, onClose }) => {
  const [selected, setSelected] = useState("");
  const folders = (storage?.subFolders || []).filter(f => f.driveFolderId !== currentFolderId);

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
        <div className="nc-modal-header">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FolderInput size={18} color="var(--color-accent)" />
              <h3>Move File</h3>
           </div>
        </div>
        
        <div className="form" style={{ marginTop: 'var(--space-4)' }}>
           <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Choose a destination folder for this document.</p>
           
           <div className="form-field">
              <label className="form-label">Target Folder</label>
              <select
                className="form-select"
                value={selected}
                onChange={e => setSelected(e.target.value)}
              >
                <option value="">Select folder…</option>
                {folders.map(f => (
                  <option key={f.driveFolderId} value={f.driveFolderId}>{f.name}</option>
                ))}
              </select>
           </div>

           <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!selected}
                onClick={() => {
                  const folder = folders.find(f => f.driveFolderId === selected);
                  onSubmit(selected, folder?.name);
                }}
              >
                Move File
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
