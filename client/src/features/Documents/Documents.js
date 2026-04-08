import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./Documents.css";

// ── File type helpers ────────────────────────────────────────────────────────

const FILE_ICONS = {
  pdf:  { icon: "📄", color: "#ef4444", label: "PDF"  },
  doc:  { icon: "📝", color: "#3b82f6", label: "Word" },
  docx: { icon: "📝", color: "#3b82f6", label: "Word" },
  xls:  { icon: "📊", color: "#22c55e", label: "Excel"},
  xlsx: { icon: "📊", color: "#22c55e", label: "Excel"},
  png:  { icon: "🖼️", color: "#a855f7", label: "Image"},
  jpg:  { icon: "🖼️", color: "#a855f7", label: "Image"},
  jpeg: { icon: "🖼️", color: "#a855f7", label: "Image"},
  webp: { icon: "🖼️", color: "#a855f7", label: "Image"},
  gif:  { icon: "🖼️", color: "#a855f7", label: "GIF"  },
};

const getFileInfo = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || { icon: "📁", color: "#8892a4", label: ext.toUpperCase() };
};

const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
};

// ── Access Denied Screen ─────────────────────────────────────────────────────

const AccessDenied = () => (
  <div className="doc-access-denied">
    <div className="doc-denied-card">
      <div className="doc-denied-icon">🔒</div>
      <h2>Restricted Area</h2>
      <p>
        The Documents vault is only accessible to <strong>HR</strong> and{" "}
        <strong>Super User</strong> users. Please contact your administrator if you
        need access to a specific file.
      </p>
    </div>
  </div>
);

// ── Storage Not Configured Banner ────────────────────────────────────────────

const StorageWarning = ({ provider }) => (
  <div className="doc-storage-warning">
    <span className="doc-warning-icon">⚠️</span>
    <div>
      <strong>Storage not configured.</strong>{" "}
      {provider === "dropbox"
        ? "Set DROPBOX_ACCESS_TOKEN in your server .env file."
        : "Set GOOGLE_SERVICE_ACCOUNT_KEY_JSON (and optionally DRIVE_FOLDER_ID) in your server .env file."}
      {" "}File uploads and viewing will not work until this is resolved.
    </div>
  </div>
);

// ── Confirm Delete Modal ─────────────────────────────────────────────────────

const ConfirmModal = ({ doc, onConfirm, onCancel, loading }) => (
  <div className="doc-modal-overlay" onClick={onCancel}>
    <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
      <div className="doc-modal-icon">🗑️</div>
      <h3>Delete Document?</h3>
      <p>
        <strong>{doc.originalName}</strong> will be permanently removed from
        storage and cannot be recovered.
      </p>
      <div className="doc-modal-actions">
        <button className="doc-btn doc-btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting…" : "Yes, Delete"}
        </button>
        <button className="doc-btn doc-btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

const Documents = () => {
  const userRole = localStorage.getItem("userRole");
  const token    = localStorage.getItem("token");

  // Only super user and hr may use this page
  const isAllowed = userRole === "super_user" || userRole === "hr";

  const [documents, setDocuments]               = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [storageConfigured, setStorageConfigured] = useState(true);
  const [storageProvider, setStorageProvider]   = useState("drive");
  const [error, setError]                       = useState("");
  const [success, setSuccess]                   = useState("");
  const [uploadProgress, setUploadProgress]     = useState(0);
  const [uploading, setUploading]               = useState(false);
  const [dragOver, setDragOver]                 = useState(false);
  const [deleteTarget, setDeleteTarget]         = useState(null);
  const [deleting, setDeleting]                 = useState(false);
  const [search, setSearch]                     = useState("");

  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch documents ──────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    if (!isAllowed) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(apiUrl("/api/documents"), { headers });
      setDocuments(res.data.data || []);
      setStorageConfigured(res.data.storageConfigured !== false);
      // Try to infer provider from env response — we expose it via the controller
      setStorageProvider(res.data.storageProvider || "drive");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [isAllowed, token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ── Auto-clear notices ───────────────────────────────────────────────────

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(t);
  }, [error]);

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = async (file) => {
    if (!file) return;
    if (!storageConfigured) {
      setError("Storage is not configured. Please set up your cloud storage credentials first.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", "general");
    formData.append("entityId", "general");
    formData.append("label", file.name);

    try {
      const res = await axios.post(apiUrl("/api/documents/upload"), formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      setDocuments((prev) => [res.data.data, ...prev]);
      setSuccess(`"${file.name}" uploaded successfully.`);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === "STORAGE_NOT_CONFIGURED") {
        setStorageConfigured(false);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Upload failed.");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ── View ─────────────────────────────────────────────────────────────────

  const handleView = (doc) => {
    if (!storageConfigured) {
      setError("Storage is not configured — cannot view files.");
      return;
    }
    const url = apiUrl(`/api/documents/view/${doc._id}`);
    // Pass token via URL param since new tab can't use JS headers
    window.open(`${url}?token=${token}`, "_blank");
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(apiUrl(`/api/documents/${deleteTarget._id}`), { headers });
      setDocuments((prev) => prev.filter((d) => d._id !== deleteTarget._id));
      setSuccess(`"${deleteTarget.originalName}" deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = documents.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.originalName?.toLowerCase().includes(q) ||
      d.label?.toLowerCase().includes(q) ||
      d.uploadedBy?.name?.toLowerCase().includes(q)
    );
  });

  // ── Render ───────────────────────────────────────────────────────────────

  if (!isAllowed) return <AccessDenied />;

  return (
    <div className="doc-page">
      {/* ─ Header ─ */}
      <div className="doc-hero">
        <div className="doc-hero-left">
          <div className="doc-badge">
            <span>🗄️</span>
            <span>NETCRADUS DOCUMENT VAULT</span>
          </div>
          <h1>Document Management</h1>
          <p>Secure file storage for HR &amp; Super User. All uploads are private and role-restricted.</p>
        </div>
        <div className="doc-hero-meta">
          <div className="doc-stat">
            <span className="doc-stat-val">{documents.length}</span>
            <span className="doc-stat-lab">Total Files</span>
          </div>
          <div className="doc-stat">
            <span className="doc-stat-val">
              {formatBytes(documents.reduce((s, d) => s + (d.fileSize || 0), 0))}
            </span>
            <span className="doc-stat-lab">Total Size</span>
          </div>
        </div>
      </div>

      {/* ─ Storage Warning ─ */}
      {!storageConfigured && <StorageWarning provider={storageProvider} />}

      {/* ─ Notices ─ */}
      {error   && <div className="doc-notice doc-notice-error">⚠ {error}</div>}
      {success && <div className="doc-notice doc-notice-success">✓ {success}</div>}

      {/* ─ Upload Zone ─ */}
      <div
        className={`doc-dropzone ${dragOver ? "doc-dropzone-active" : ""} ${!storageConfigured ? "doc-dropzone-disabled" : ""}`}
        onDragOver={(e) => { e.preventDefault(); if (storageConfigured) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => storageConfigured && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
        {uploading ? (
          <div className="doc-upload-progress">
            <div className="doc-spinner" />
            <span>Uploading… {uploadProgress}%</span>
            <div className="doc-progress-bar">
              <div className="doc-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="doc-drop-icon">☁️</div>
            <p className="doc-drop-title">
              {storageConfigured ? "Drag & drop a file, or click to browse" : "Storage not configured — uploads disabled"}
            </p>
            <p className="doc-drop-sub">PDF, DOCX, XLSX, Images — max 20 MB</p>
          </>
        )}
      </div>

      {/* ─ Search & Table ─ */}
      <div className="doc-panel">
        <div className="doc-toolbar">
          <div className="doc-search-wrap">
            <span className="doc-search-icon">🔍</span>
            <input
              className="doc-search"
              type="text"
              placeholder="Search by name or uploader…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="doc-count">{filtered.length} file{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="doc-loading">
            <div className="doc-spinner" />
            <span>Loading documents…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="doc-empty">
            <div className="doc-empty-icon">📂</div>
            <p>{search ? "No files match your search." : "No documents uploaded yet. Drop a file above to get started."}</p>
          </div>
        ) : (
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const info = getFileInfo(doc.originalName);
                  return (
                    <tr key={doc._id}>
                      <td data-label="File">
                        <div className="doc-name-cell">
                          <span className="doc-file-icon" style={{ color: info.color }}>{info.icon}</span>
                          <div>
                            <div className="doc-file-name">{doc.label || doc.originalName}</div>
                            {doc.description && (
                              <div className="doc-file-desc">{doc.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Type">
                        <span className="doc-type-chip" style={{ borderColor: info.color, color: info.color }}>
                          {info.label}
                        </span>
                      </td>
                      <td data-label="Size">{formatBytes(doc.fileSize)}</td>
                      <td data-label="Uploaded By">
                        <span className="doc-uploader">
                          {doc.uploadedBy?.name || doc.uploadedBy?.email || "—"}
                        </span>
                      </td>
                      <td data-label="Date">{formatDate(doc.uploadedAt)}</td>
                      <td data-label="Actions">
                        <div className="doc-actions">
                          <button
                            className="doc-action-btn doc-action-view"
                            onClick={() => handleView(doc)}
                            title="View file"
                            disabled={!storageConfigured}
                          >
                            👁 View
                          </button>
                          <button
                            className="doc-action-btn doc-action-delete"
                            onClick={() => setDeleteTarget(doc)}
                            title="Delete file"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─ Confirm Delete Modal ─ */}
      {deleteTarget && (
        <ConfirmModal
          doc={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default Documents;
