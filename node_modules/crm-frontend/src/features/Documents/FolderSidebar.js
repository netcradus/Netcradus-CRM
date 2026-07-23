import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2, Plus, Folder, FolderOpen } from "lucide-react";

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
    <div style={{
      position: 'absolute',
      right: '0',
      top: '100%',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
      minWidth: '160px',
      overflow: 'hidden'
    }} ref={ref}>
      <button
        className="btn btn-ghost"
        style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-error)', height: '40px' }}
        onClick={() => { onDelete(folder.name); onClose(); }}
        disabled={folder.isDefault}
      >
        <Trash2 size={14} />
        Delete Folder
      </button>
    </div>
  );
};

const FolderSidebar = ({ storage, activeFolderId, onFolderSelect, onAddFolder, onDeleteFolder }) => {
  const [openMenu, setOpenMenu] = useState(null); 

  const subFolders = storage?.subFolders || [];
  const defaultFolders = subFolders.filter(f => f.isDefault);
  const customFolders = subFolders.filter(f => !f.isDefault);

  const FolderButton = ({ folder, isDefault }) => {
     const isActive = activeFolderId === folder.driveFolderId;
     return (
        <div style={{ position: "relative" }}>
          <div
            onClick={() => onFolderSelect(folder.driveFolderId, folder.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: isActive ? 'var(--color-bg-active)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              textAlign: 'left',
              transition: 'all 0.2s',
              marginBottom: '2px'
            }}
          >
            <span style={{ fontSize: '16px' }}>{getFolderIcon(folder.name, isDefault)}</span>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)' }}>{folder.name}</span>
            {!isDefault && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === folder.name ? null : folder.name); }}
              >
                <MoreVertical size={12} />
              </button>
            )}
          </div>
          {openMenu === folder.name && (
            <FolderMenu
              folder={folder}
              onDelete={onDeleteFolder}
              onClose={() => setOpenMenu(null)}
            />
          )}
        </div>
     );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {defaultFolders.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 'var(--font-bold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', padding: '0 var(--space-2)' }}>System Folders</div>
          {defaultFolders.map(folder => <FolderButton key={folder.driveFolderId} folder={folder} isDefault={true} />)}
        </div>
      )}

      {customFolders.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 'var(--font-bold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', padding: '0 var(--space-2)' }}>Custom Folders</div>
          {customFolders.map(folder => <FolderButton key={folder.driveFolderId} folder={folder} isDefault={false} />)}
        </div>
      )}

      <button 
        onClick={onAddFolder}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-2)', 
          padding: 'var(--space-2) var(--space-3)', 
          background: 'var(--color-bg-base)', 
          border: '1px dashed var(--color-border)', 
          borderRadius: 'var(--radius-md)', 
          color: 'var(--color-text-secondary)', 
          fontSize: 'var(--text-xs)', 
          cursor: 'pointer',
          marginTop: 'var(--space-2)'
        }}
      >
        <Plus size={14} /> New Custom Folder
      </button>
    </div>
  );
};

export default FolderSidebar;
