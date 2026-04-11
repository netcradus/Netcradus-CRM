import React, { useState, useRef, useEffect } from "react";
import { Eye, Download, Trash2, Pencil, FolderInput, MoreVertical } from "lucide-react";
import { getFileType, formatBytes, formatDate, getViewUrl, getDownloadUrl } from "./fileHelpers";
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
          <div className="file-row-name" onClick={onView} title="View file">
            <span style={{ fontSize: "1.2rem" }}>{type.icon}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
              {doc.originalName}
            </span>
          </div>
        </td>
        <td>
          <span className="file-type-badge" style={{ color: type.color, borderColor: type.color }}>
            {type.label}
          </span>
        </td>
        <td style={{ color: "var(--nc-text-muted)", fontSize: "0.8rem" }}>{formatBytes(doc.fileSizeBytes)}</td>
        <td style={{ color: "var(--nc-text-muted)", fontSize: "0.8rem" }}>{formatDate(doc.uploadedAt)}</td>
        <td>
          <div className="file-row-actions" style={{ opacity: 1 }}>
            <button className="file-action-btn" onClick={onView} title="View"><Eye size={13} /></button>
            <a className="file-action-btn" href={getDownloadUrl(doc._id)} download={doc.originalName} title="Download">
              <Download size={13} />
            </a>
            <div style={{ position: "relative" }} ref={menuRef}>
              <button className="file-action-btn" onClick={() => setShowMenu(m => !m)} title="More">
                <MoreVertical size={13} />
              </button>
              {showMenu && (
                <div className="folder-context-menu" style={{ right: 0, top: "calc(100% + 4px)" }}>
                  <button onClick={() => { setShowRename(true); setShowMenu(false); }}><Pencil size={12} /> Rename</button>
                  <button onClick={() => { setShowMove(true); setShowMenu(false); }}><FolderInput size={12} /> Move</button>
                  <button className="danger" onClick={() => { onDelete(); setShowMenu(false); }}><Trash2 size={12} /> Delete</button>
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
