import React, { useState, useRef, useEffect } from "react";
import { Eye, Download, Trash2, Pencil, FolderInput, MoreVertical } from "lucide-react";
import { getFileType, formatBytes, formatDate, getDownloadUrl } from "./fileHelpers";
import RenameModal from "./RenameModal";
import MoveModal from "./MoveModal";

const FileRow = ({ doc, storage, onView, onDelete, onRename, onMove }) => {
  const type = getFileType(doc.mimeType);
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <>
      <tr>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }} onClick={onView} title="View file">
            <span style={{ fontSize: "1.2rem" }}>{type.icon}</span>
            <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>
              {doc.originalName}
            </span>
          </div>
        </td>
        <td>
          <span className="badge" style={{ color: type.color, background: 'var(--color-bg-base)', border: `1px solid ${type.color}40` }}>
            {type.label}
          </span>
        </td>
        <td style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{formatBytes(doc.fileSizeBytes)}</td>
        <td style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{formatDate(doc.uploadedAt)}</td>
        <td>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button className="btn btn--sm btn-ghost" onClick={onView} title="View"><Eye size={14} /></button>
            <a className="btn btn--sm btn-ghost" href={getDownloadUrl(doc._id)} download={doc.originalName} title="Download">
              <Download size={14} />
            </a>
            <div style={{ position: "relative" }} ref={menuRef}>
              <button className="btn btn--sm btn-ghost" onClick={() => setShowMenu(m => !m)} title="More">
                <MoreVertical size={14} />
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: 'calc(100% + 4px)',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  minWidth: '140px',
                  overflow: 'hidden'
                }}>
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', height: '36px' }} onClick={() => { setShowRename(true); setShowMenu(false); }}><Pencil size={12} /> Rename</button>
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', height: '36px' }} onClick={() => { setShowMove(true); setShowMenu(false); }}><FolderInput size={12} /> Move</button>
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', height: '36px', color: 'var(--color-error)' }} onClick={() => { onDelete(); setShowMenu(false); }}><Trash2 size={12} /> Delete</button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>

      {showRename && (
        <RenameModal
          currentName={doc.originalName}
          onSubmit={(n) => { onRename(n); setShowRename(false); }}
          onClose={() => setShowRename(false)}
        />
      )}

      {showMove && (
        <MoveModal
          currentFolderId={doc.folderId}
          storage={storage}
          onSubmit={(id, name) => { onMove(id, name); setShowMove(false); }}
          onClose={() => setShowMove(false)}
        />
      )}
    </>
  );
};

export default FileRow;
