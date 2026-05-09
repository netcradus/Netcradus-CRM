import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { X, UploadCloud, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { ALLOWED_MIME_TYPES } from "./fileHelpers";

const MAX_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTS_LABEL = "Images, PDF, Word, Excel, PowerPoint, CSV, TXT";

const validateFile = (file, storage) => {
  if (!ALLOWED_MIME_TYPES || !ALLOWED_MIME_TYPES.includes(file.type)) {
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

const UploadZone = ({ folderId, folderName, storage, targetUserId, onSuccess, onClose }) => {
  const [queue, setQueue] = useState([]);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: dragging ? '2px dashed var(--color-accent)' : '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10) var(--space-6)',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: dragging ? 'var(--color-bg-hover)' : 'var(--color-bg-base)',
          transition: 'all 0.2s',
          opacity: uploading ? 0.6 : 1
        }}
      >
        <input ref={inputRef} type="file" hidden multiple onChange={e => addFiles(e.target.files)} />
        <UploadCloud size={40} style={{ color: dragging ? 'var(--color-accent)' : 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }} />
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>
           {dragging ? "Release to upload" : "Drag files here or click to browse"}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          {ALLOWED_EXTS_LABEL} — max 50 MB per file
        </div>
      </div>

      {queue.length > 0 && (
        <div className="nc-card" style={{ padding: 'var(--space-4)', maxHeight: '300px', overflowY: 'auto' }}>
           <div style={{ fontSize: '10px', fontWeight: 'var(--font-bold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>Upload Queue ({queue.length})</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {queue.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                   <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.file.name}</div>
                      {item.status === 'uploading' && (
                         <div style={{ height: '4px', background: 'var(--color-bg-elevated)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${item.progress}%`, background: 'var(--color-accent)', transition: 'width 0.2s' }} />
                         </div>
                      )}
                      {item.status === 'error' && <div style={{ fontSize: '10px', color: 'var(--color-error)', marginTop: '2px' }}>{item.error}</div>}
                   </div>
                   <div style={{ flexShrink: 0 }}>
                      {item.status === 'done' && <CheckCircle2 size={16} color="var(--color-success)" />}
                      {item.status === 'error' && <AlertCircle size={16} color="var(--color-error)" />}
                      {item.status === 'pending' && <button className="btn btn--sm btn-ghost" onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }}><Trash2 size={14} /></button>}
                   </div>
                </div>
              ))}
           </div>
           
           <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                disabled={uploading || !queue.some(q => q.status === 'pending')}
                onClick={handleUploadAll}
              >
                {uploading ? "Uploading..." : "Start Upload"}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setQueue([])}>Clear Queue</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
