import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { X, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { ALLOWED_MIME_TYPES } from "./fileHelpers";

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

// ── helpers ────────────────────────────────────────────────────────────────────

// Redefine locally so no circular dep on fileHelpers
const ALLOWED_EXTS_LABEL = "images, PDF, Word, Excel, PowerPoint, CSV, TXT";

const validateFile = (file, storage) => {
  if (!ALLOWED_MIME_TYPES || !ALLOWED_MIME_TYPES.includes(file.type)) {
    // Fallback: allow common types
    const allowedTypes = [
      "image/jpeg","image/png","image/webp","image/gif",
      "application/pdf","application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain","text/csv",
    ];
    if (!allowedTypes.includes(file.type)) return `"${file.name}" — file type not allowed.`;
  }
  if (file.size > MAX_SIZE_BYTES) return `"${file.name}" exceeds 50MB limit.`;
  if (storage) {
    const fileMB = file.size / (1024 * 1024);
    if (storage.usedMB + fileMB > storage.quotaMB) return `"${file.name}" would exceed your storage quota.`;
  }
  return null;
};

// ── UploadZone ────────────────────────────────────────────────────────────────

const UploadZone = ({ folderId, folderName, storage, targetUserId, onSuccess, onClose }) => {
  const [queue, setQueue] = useState([]); // { file, status, progress, error }
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((incoming) => {
    const newItems = Array.from(incoming).map(file => {
      const err = validateFile(file, storage);
      return { id: Math.random(), file, status: err ? "error" : "pending", progress: 0, error: err };
    });
    setQueue(prev => [...prev, ...newItems]);
  }, [storage]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUploadAll = async () => {
    if (!folderId) {
      alert("Please select a folder first.");
      return;
    }
    const pending = queue.filter(q => q.status === "pending");
    if (!pending.length) return;

    setUploading(true);

    for (const item of pending) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "uploading" } : q));
      try {
        const form = new FormData();
        form.append("file", item.file);
        form.append("folderId", folderId);
        if (targetUserId) form.append("userId", targetUserId);

        const { data } = await axios.post(apiUrl("/api/documents/upload"), form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: pct } : q));
          },
        });

        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "done", progress: 100 } : q));
        onSuccess(data.data);
      } catch (err) {
        const msg = err.response?.data?.message || "Upload failed.";
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "error", error: msg } : q));
      }
    }

    setUploading(false);
  };

  const removeFromQueue = (id) => setQueue(prev => prev.filter(q => q.id !== id));
  const clearDone = () => setQueue(prev => prev.filter(q => q.status !== "done"));

  return (
    <div style={{ padding: "12px 20px 0", borderBottom: "1px solid var(--nc-border-subtle)", background: "var(--nc-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: "0.84rem", color: "var(--nc-text-muted)" }}>
          Upload to <strong style={{ color: "var(--nc-text)" }}>{folderName}</strong>
        </span>
        <button className="drive-modal-close" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Drop zone */}
      <div
        className={`drive-upload-zone ${dragging ? "dragover" : ""} ${uploading ? "uploading" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" hidden multiple onChange={e => addFiles(e.target.files)} />
        <div className="upload-zone-icon"><UploadCloud size={28} /></div>
        <div className="upload-zone-title">Drag & drop files, or click to browse</div>
        <div className="upload-zone-sub">{ALLOWED_EXTS_LABEL} — max 50 MB per file</div>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="upload-queue" style={{ marginBottom: 12 }}>
          {queue.map(item => (
            <div key={item.id} className="upload-queue-item">
              <span className="upload-status-icon">
                {item.status === "done" && <CheckCircle2 size={15} color="#4ade80" />}
                {item.status === "error" && <AlertCircle size={15} color="#f87171" />}
                {item.status === "uploading" && <div className="drive-spinner" />}
                {item.status === "pending" && <UploadCloud size={15} color="var(--nc-text-muted)" />}
              </span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                {item.file.name}
              </span>
              {item.status === "uploading" && (
                <div className="upload-progress-bar-wrap">
                  <div className="upload-progress-bar-fill" style={{ width: `${item.progress}%` }} />
                </div>
              )}
              {item.status === "error" && (
                <span style={{ fontSize: "0.72rem", color: "#f87171", flexShrink: 0, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }} title={item.error}>{item.error}</span>
              )}
              {item.status !== "uploading" && (
                <button className="drive-modal-close" onClick={() => removeFromQueue(item.id)} style={{ position: "static", padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            className="drive-btn drive-btn-primary"
            disabled={uploading || !queue.some(q => q.status === "pending")}
            onClick={handleUploadAll}
          >
            {uploading ? "Uploading…" : `Upload ${queue.filter(q => q.status === "pending").length} File(s)`}
          </button>
          <button className="drive-btn drive-btn-ghost" onClick={clearDone}>Clear Done</button>
          <button className="drive-btn drive-btn-ghost" onClick={() => setQueue([])}>Clear All</button>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
