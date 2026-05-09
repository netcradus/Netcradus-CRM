import React, { useState, useRef, useEffect } from "react";
import { Eye, Download, Trash2, Pencil, FolderInput, MoreVertical } from "lucide-react";
import { getFileType, isImage, formatBytes, formatDate, getViewUrl, getDownloadUrl } from "./fileHelpers";
import RenameModal from "./RenameModal";
import MoveModal from "./MoveModal";

const FileCard = ({ doc, storage, onView, onDelete, onRename, onMove }) => {
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
      <div className="nc-card nc-card--interactive" onClick={onView} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', position: 'relative' }}>
        {/* Thumbnail */}
        <div style={{ width: '100%', aspectRatio: '16/10', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {isImage(doc.mimeType) ? (
            <img src={getViewUrl(doc._id)} alt={doc.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          ) : (
            <span style={{ fontSize: '32px' }}>{type.icon}</span>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
           <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.originalName}>{doc.originalName}</div>
           <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{formatBytes(doc.fileSizeBytes)} · {formatDate(doc.uploadedAt)}</div>
        </div>

        <div style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
           <button className="btn btn--sm btn-ghost" style={{ width: '28px', padding: 0, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }} onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }}>
              <MoreVertical size={12} />
           </button>
           {showMenu && (
             <div style={{
               position: 'absolute',
               right: '0',
               top: '100%',
               background: 'var(--color-bg-elevated)',
               border: '1px solid var(--color-border)',
               borderRadius: 'var(--radius-md)',
               boxShadow: 'var(--shadow-lg)',
               zIndex: 100,
               minWidth: '140px',
               overflow: 'hidden',
               marginTop: '4px'
             }} ref={menuRef}>
               <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', height: '36px' }} onClick={() => { setShowRename(true); setShowMenu(false); }}><Pencil size={12} /> Rename</button>
               <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', height: '36px' }} onClick={() => { setShowMove(true); setShowMenu(false); }}><FolderInput size={12} /> Move</button>
               <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', height: '36px', color: 'var(--color-error)' }} onClick={() => { onDelete(); setShowMenu(false); }}><Trash2 size={12} /> Delete</button>
             </div>
           )}
        </div>
      </div>

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

export default FileCard;
