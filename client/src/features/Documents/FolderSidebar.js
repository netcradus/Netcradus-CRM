import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2, FolderOpen, Plus } from "lucide-react";

// Role-specific folder icons
const FOLDER_ICONS = {
  general: "📁", administration: "🏢", reports: "📊", archives: "🗄️",
  cvs: "📋", "salary-slips": "💰", contracts: "📜", onboarding: "🧭",
  invoices: "🧾", proposals: "📝", "client-docs": "🤝",
  tickets: "🎫", assets: "🖥️", licenses: "🔑", "technical-docs": "⚙️",
  creatives: "🎨", campaigns: "📣", "brand-assets": "✨",
};

const getFolderIcon = (name, isDefault) => {
  if (isDefault && FOLDER_ICONS[name]) return FOLDER_ICONS[name];
  return "📂";
};

// Context menu for custom folders
const FolderMenu = ({ folder, onDelete, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="folder-context-menu" ref={ref}>
      <button
        className="danger"
        onClick={() => { onDelete(folder.name); onClose(); }}
        disabled={folder.isDefault}
        title={folder.isDefault ? "Default folders cannot be deleted" : "Delete folder"}
      >
        <Trash2 size={13} />
        Delete Folder
      </button>
    </div>
  );
};

const FolderSidebar = ({ storage, activeFolderId, onFolderSelect, onAddFolder, onDeleteFolder }) => {
  const [openMenu, setOpenMenu] = useState(null); // folder name with open menu

  const subFolders = storage?.subFolders || [];
  const defaultFolders = subFolders.filter(f => f.isDefault);
  const customFolders = subFolders.filter(f => !f.isDefault);

  return (
    <div className="drive-sidebar">
      {defaultFolders.length > 0 && (
        <>
          <div className="drive-sidebar-section">Folders</div>
          {defaultFolders.map(folder => (
            <div key={folder.driveFolderId} style={{ position: "relative" }}>
              <button
                className={`drive-folder-btn ${activeFolderId === folder.driveFolderId ? "active" : ""}`}
                onClick={() => onFolderSelect(folder.driveFolderId, folder.name)}
              >
                <span>{getFolderIcon(folder.name, folder.isDefault)}</span>
                <span className="folder-name">{folder.name}</span>
              </button>
            </div>
          ))}
        </>
      )}

      {customFolders.length > 0 && (
        <>
          <div className="drive-sidebar-section">Custom</div>
          {customFolders.map(folder => (
            <div key={folder.driveFolderId} style={{ position: "relative" }}>
              <button
                className={`drive-folder-btn ${activeFolderId === folder.driveFolderId ? "active" : ""}`}
                onClick={() => onFolderSelect(folder.driveFolderId, folder.name)}
              >
                <span>{getFolderIcon(folder.name, false)}</span>
                <span className="folder-name">{folder.name}</span>
                <button
                  className="folder-menu-btn"
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === folder.name ? null : folder.name); }}
                  title="Folder options"
                >
                  <MoreVertical size={13} />
                </button>
              </button>

              {openMenu === folder.name && (
                <FolderMenu
                  folder={folder}
                  onDelete={onDeleteFolder}
                  onClose={() => setOpenMenu(null)}
                />
              )}
            </div>
          ))}
        </>
      )}

      <button className="drive-add-folder-btn" onClick={onAddFolder} title="Create custom folder">
        <Plus size={14} />
        <span>Add Folder</span>
      </button>
    </div>
  );
};

export default FolderSidebar;
