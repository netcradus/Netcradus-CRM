import React from "react";

function FolderSidebar({ folders, loading, selectedFolderId, unreadCount, onSelectFolder }) {
  if (loading) {
    return <div className="mail-panel mail-panel--folders">Loading folders...</div>;
  }

  return (
    <div className="mail-panel mail-panel--folders">
      <div className="mail-panel__header">Folders</div>
      <div className="mail-folder-list">
        {folders.map((folder) => {
          const isInbox = String(folder.name || "").toLowerCase().includes("inbox");
          return (
            <button
              key={folder.folderId}
              type="button"
              className={`mail-folder-item ${selectedFolderId === folder.folderId ? "is-active" : ""}`}
              onClick={() => onSelectFolder(folder)}
            >
              <span>{folder.name}</span>
              <span className="mail-folder-item__meta">
                {isInbox && unreadCount > 0 ? <span className="mail-badge">{unreadCount}</span> : null}
                {!isInbox && Number(folder.unreadCount || 0) > 0 ? <span className="mail-badge">{folder.unreadCount}</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FolderSidebar;
