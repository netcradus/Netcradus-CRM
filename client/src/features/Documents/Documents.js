import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./Documents.css";

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
  <div className="drive-toast">
    {toasts.map(t => (
      <div key={t.id} className={`drive-toast-item ${t.type}`}>
        {t.type === "success" ? "✅" : "❌"} {t.message}
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
        // Storage not provisioned yet
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
      // "date" is already default server sort

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

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (storage) fetchFiles(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]); // eslint-disable-line

  // ── Folder selection ───────────────────────────────────────────────────────

  const handleFolderSelect = (folderId, name) => {
    setActiveFolderId(folderId);
    setActiveFolderName(name || "All Files");
    setSearch("");
  };

  // ── Upload success ─────────────────────────────────────────────────────────

  const handleUploadSuccess = (newDoc) => {
    setFiles(prev => [newDoc, ...prev]);
    fetchStorage(); // refresh quota
    push(`"${newDoc.originalName}" uploaded.`);
    setShowUpload(false);
  };

  // ── Delete file ────────────────────────────────────────────────────────────

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

  // ── Rename file ────────────────────────────────────────────────────────────

  const handleRenameFile = async (docId, newName) => {
    try {
      const { data } = await axios.patch(apiUrl(`/api/documents/${docId}/rename`), { newName }, { headers: authHeaders() });
      setFiles(prev => prev.map(f => f._id === docId ? { ...f, originalName: data.data.originalName } : f));
      push("File renamed.");
    } catch (err) {
      push(err.response?.data?.message || "Rename failed.", "error");
    }
  };

  // ── Move file ──────────────────────────────────────────────────────────────

  const handleMoveFile = async (docId, targetFolderId, targetName) => {
    try {
      await axios.patch(apiUrl(`/api/documents/${docId}/move`), { targetFolderId }, { headers: authHeaders() });
      setFiles(prev => prev.filter(f => f._id !== docId)); // remove from current view
      push(`File moved to "${targetName}".`);
    } catch (err) {
      push(err.response?.data?.message || "Move failed.", "error");
    }
  };

  // ── Create custom folder ───────────────────────────────────────────────────

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

  // ── Delete custom folder ───────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  if (storageLoading) {
    return (
      <div className="drive-page">
        <div className="drive-loading" style={{ flex: 1 }}>
          <div className="drive-spinner" />
          <span>Loading your drive…</span>
        </div>
      </div>
    );
  }

  if (!storage) {
    return (
      <div className="drive-page">
        <div className="drive-no-storage">
          <div style={{ fontSize: "3rem" }}>☁️</div>
          <h2>Drive Not Ready</h2>
          <p>Your personal Drive storage is being set up. Please check back in a moment, or contact your administrator.</p>
        </div>
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  return (
    <div className="drive-page">
      {targetUserId && (
        <div style={{ background: "var(--nc-primary)", color: "#fff", padding: "8px 16px", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>👀 Admin Mode: Viewing storage for {targetUserName || targetUserId}</span>
          <a href="/admin/storage" style={{ color: "#fff", textDecoration: "underline", fontSize: "0.8rem" }}>Back to Admin</a>
        </div>
      )}
      <StorageHeader
        storage={storage}
        onUpgradeClick={() => window.location.href = "/tickets"}
      />

      <div className="drive-body">
        <FolderSidebar
          storage={storage}
          activeFolderId={activeFolderId}
          onFolderSelect={handleFolderSelect}
          onAddFolder={() => setShowAddFolder(true)}
          onDeleteFolder={handleDeleteFolder}
        />

        <div className="drive-main">
          {showUpload && (
            <UploadZone
              folderId={activeFolderId}
              folderName={activeFolderName}
              storage={storage}
              targetUserId={targetUserId}
              onSuccess={handleUploadSuccess}
              onClose={() => setShowUpload(false)}
            />
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
