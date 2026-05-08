import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { ChevronRight, Database, FolderPlus, Upload, ShieldAlert, Cloud } from "lucide-react";

import StorageHeader from "./StorageHeader";
import FolderSidebar from "./FolderSidebar";
import FileListPanel from "./FileListPanel";
import UploadZone from "./UploadZone";
import AddFolderModal from "./AddFolderModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

let toastId = 0;

// ── Toast hook ────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  return { toasts, push };
};

// ── Toast renderer ────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    {toasts.map(t => (
      <div key={t.id} className={`badge badge-${t.type === 'success' ? 'success' : 'error'}`} style={{ padding: 'var(--space-3) var(--space-4)', boxShadow: 'var(--shadow-lg)' }}>
        {t.message}
      </div>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const MyStoragePage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get("userId");
  const targetUserName = queryParams.get("userName");

  const { toasts, push } = useToast();

  const [storage, setStorage] = useState(null);
  const [storageLoading, setStorageLoading] = useState(true);

  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeFolderName, setActiveFolderName] = useState("All Files");

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });

  const [search, setSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid");

  const [showUpload, setShowUpload] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);

  const searchTimer = useRef(null);

  // ── Fetch storage ──────────────────────────────────────────────────────────

  const fetchStorage = useCallback(async () => {
    setStorageLoading(true);
    try {
      const endpoint = targetUserId ? `/api/documents/storage?userId=${targetUserId}` : "/api/documents/storage";
      const { data } = await axios.get(apiUrl(endpoint), { headers: authHeaders() });
      setStorage(data.data);
      // Default to first folder if none selected
      if (!activeFolderId && data.data.subFolders?.length) {
        const general = data.data.subFolders.find(f => f.name === "general") || data.data.subFolders[0];
        setActiveFolderId(general.driveFolderId);
        setActiveFolderName(general.name);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setStorage(null);
      } else {
        push(err.response?.data?.message || "Failed to load storage info.", "error");
      }
    } finally {
      setStorageLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchStorage(); }, [fetchStorage]);

  // ── Fetch files ────────────────────────────────────────────────────────────

  const fetchFiles = useCallback(async (page = 1) => {
    setFilesLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
      });
      if (activeFolderId) params.set("folderId", activeFolderId);
      if (search) params.set("search", search);
      if (mimeFilter) params.set("mimeType", mimeFilter);
      if (targetUserId) params.set("userId", targetUserId);

      const { data } = await axios.get(apiUrl(`/api/documents/files?${params}`), { headers: authHeaders() });
      let docs = data.data || [];

      // Client-side sort
      if (sortBy === "name") docs.sort((a, b) => (a.originalName || "").localeCompare(b.originalName || ""));
      if (sortBy === "size") docs.sort((a, b) => (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0));

      setFiles(docs);
      setPagination(data.pagination || { page: 1, pages: 1, total: docs.length, limit: 20 });
    } catch (err) {
      push(err.response?.data?.message || "Failed to load files.", "error");
    } finally {
      setFilesLoading(false);
    }
  }, [activeFolderId, search, mimeFilter, sortBy, pagination.limit]); // eslint-disable-line

  useEffect(() => {
    if (storage) fetchFiles(1);
  }, [activeFolderId, mimeFilter, sortBy, storage]); // eslint-disable-line

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (storage) fetchFiles(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]); // eslint-disable-line

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFolderSelect = (folderId, name) => {
    setActiveFolderId(folderId);
    setActiveFolderName(name || "All Files");
    setSearch("");
  };

  const handleUploadSuccess = (newDoc) => {
    setFiles(prev => [newDoc, ...prev]);
    fetchStorage(); 
    push(`"${newDoc.originalName}" uploaded.`);
    setShowUpload(false);
  };

  const handleDeleteFile = async (docId, name) => {
    try {
      await axios.delete(apiUrl(`/api/documents/${docId}`), { headers: authHeaders() });
      setFiles(prev => prev.filter(f => f._id !== docId));
      fetchStorage();
      push(`"${name}" deleted.`);
    } catch (err) {
      push(err.response?.data?.message || "Delete failed.", "error");
    }
  };

  const handleRenameFile = async (docId, newName) => {
    try {
      const { data } = await axios.patch(apiUrl(`/api/documents/${docId}/rename`), { newName }, { headers: authHeaders() });
      setFiles(prev => prev.map(f => f._id === docId ? { ...f, originalName: data.data.originalName } : f));
      push("File renamed.");
    } catch (err) {
      push(err.response?.data?.message || "Rename failed.", "error");
    }
  };

  const handleMoveFile = async (docId, targetFolderId, targetName) => {
    try {
      await axios.patch(apiUrl(`/api/documents/${docId}/move`), { targetFolderId }, { headers: authHeaders() });
      setFiles(prev => prev.filter(f => f._id !== docId)); 
      push(`File moved to "${targetName}".`);
    } catch (err) {
      push(err.response?.data?.message || "Move failed.", "error");
    }
  };

  const handleCreateFolder = async (folderName) => {
    try {
      const payload = { folderName };
      if (targetUserId) payload.userId = targetUserId;
      const { data } = await axios.post(apiUrl("/api/documents/folders"), payload, { headers: authHeaders() });
      setStorage(data.data);
      push(`Folder "${folderName}" created.`);
      setShowAddFolder(false);
    } catch (err) {
      push(err.response?.data?.message || "Failed to create folder.", "error");
      throw err;
    }
  };

  const handleDeleteFolder = async (folderName) => {
    try {
      const endpoint = targetUserId 
        ? `/api/documents/folders/${encodeURIComponent(folderName)}?userId=${targetUserId}` 
        : `/api/documents/folders/${encodeURIComponent(folderName)}`;
      const { data } = await axios.delete(apiUrl(endpoint), { headers: authHeaders() });
      setStorage(data.data);
      if (activeFolderName === folderName) {
        const general = data.data.subFolders?.find(f => f.name === "general") || data.data.subFolders?.[0];
        if (general) {
          setActiveFolderId(general.driveFolderId);
          setActiveFolderName(general.name);
        } else {
          setActiveFolderId(null);
          setActiveFolderName("All Files");
        }
      }
      push(`Folder "${folderName}" deleted.`);
    } catch (err) {
      push(err.response?.data?.message || "Failed to delete folder.", "error");
    }
  };

  if (storageLoading) return <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="btn-spinner" /></div>;

  if (!storage) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
           <Cloud size={48} className="icon" />
           <h3>Cloud Drive Unavailable</h3>
           <p>Your storage is being provisioned or is currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Drive</span><ChevronRight size={10} /><span>{activeFolderName}</span>
           </div>
           <h1 className="title">Cloud Storage</h1>
           <p className="subtitle">Secure file management and document hosting.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-2)' }}>
           <button className="btn btn-secondary" onClick={() => setShowAddFolder(true)}><FolderPlus size={16} /> New Folder</button>
           <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}><Upload size={16} /> Upload File</button>
        </div>
      </div>

      {targetUserId && (
        <div className="badge badge-warning" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', width: '100%', justifyContent: 'center' }}>
          <ShieldAlert size={14} style={{ marginRight: '8px' }} />
          Admin Mode: Viewing storage for {targetUserName || targetUserId}
        </div>
      )}

      <StorageHeader storage={storage} onUpgradeClick={() => {}} />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-6)', flex: 1, minHeight: 0, marginTop: 'var(--space-6)' }}>
        <div className="nc-card" style={{ padding: 'var(--space-4)', overflowY: 'auto' }}>
          <FolderSidebar
            storage={storage}
            activeFolderId={activeFolderId}
            onFolderSelect={handleFolderSelect}
            onAddFolder={() => setShowAddFolder(true)}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        <div className="nc-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showUpload && (
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-base)' }}>
               <UploadZone
                folderId={activeFolderId}
                folderName={activeFolderName}
                storage={storage}
                targetUserId={targetUserId}
                onSuccess={handleUploadSuccess}
                onClose={() => setShowUpload(false)}
              />
            </div>
          )}

          <FileListPanel
            files={files}
            loading={filesLoading}
            viewMode={viewMode}
            search={search}
            mimeFilter={mimeFilter}
            sortBy={sortBy}
            folderName={activeFolderName}
            storage={storage}
            pagination={pagination}
            onSearchChange={setSearch}
            onMimeFilterChange={setMimeFilter}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onUploadClick={() => setShowUpload(!showUpload)}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
            onMoveFile={handleMoveFile}
            onPageChange={(p) => fetchFiles(p)}
          />
        </div>
      </div>

      {showAddFolder && (
        <AddFolderModal
          existingFolders={storage.subFolders.map(f => f.name)}
          onSubmit={handleCreateFolder}
          onClose={() => setShowAddFolder(false)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default MyStoragePage;
