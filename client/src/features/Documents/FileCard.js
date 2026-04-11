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
      <div className="file-card" onClick={onView}>
        {/* Thumbnail */}
        <div className="file-card-thumb">
          {isImage(doc.mimeType) ? (
            <img src={getViewUrl(doc._id)} alt={doc.originalName} loading="lazy" />
          ) : (
            <span className="file-type-icon">{type.icon}</span>
          )}
        </div>

        <div className="file-card-name" title={doc.originalName}>{doc.originalName}</div>
        <div className="file-card-meta">{formatBytes(doc.fileSizeBytes)} · {formatDate(doc.uploadedAt)}</div>

        {/* Hover action buttons */}
        <div className="file-card-actions" onClick={e => e.stopPropagation()}>
          <button className="file-action-btn" onClick={onView} title="View"><Eye size={13} /></button>
          <a className="file-action-btn" href={getDownloadUrl(doc._id)} download={doc.originalName} title="Download" onClick={e => e.stopPropagation()}>
            <Download size={13} />
          </a>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button className="file-action-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }} title="More">
              <MoreVertical size={13} />
            </button>
            {showMenu && (
              <div className="folder-context-menu" style={{ bottom: "100%", top: "auto" }}>
                <button onClick={() => { setShowRename(true); setShowMenu(false); }}><Pencil size={12} /> Rename</button>
                <button onClick={() => { setShowMove(true); setShowMenu(false); }}><FolderInput size={12} /> Move</button>
                <button className="danger" onClick={() => { onDelete(); setShowMenu(false); }}><Trash2 size={12} /> Delete</button>
              </div>
            )}
          </div>
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
