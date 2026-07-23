import React from "react";
import { X, Download, FileText } from "lucide-react";
import { isImage, isPDF, getFileType, formatBytes, formatDate, getViewUrl, getDownloadUrl } from "./fileHelpers";

const FileViewer = ({ doc, onClose }) => {
  const type = getFileType(doc.mimeType);
  const viewUrl = getViewUrl(doc._id);
  const downloadUrl = getDownloadUrl(doc._id);

  const renderPreview = () => {
    if (isImage(doc.mimeType)) {
      return <img src={viewUrl} alt={doc.originalName} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 'var(--radius-lg)' }} />;
    }
    if (isPDF(doc.mimeType)) {
      return <iframe src={viewUrl} title={doc.originalName} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 'var(--radius-lg)' }} />;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 'var(--space-6)', padding: 'var(--space-16)', color: "var(--color-text-muted)" }}>
        <span style={{ fontSize: "4rem" }}>{type.icon}</span>
        <div style={{ textAlign: 'center' }}>
           <h3 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>Preview Unavailable</h3>
           <p style={{ fontSize: "var(--text-sm)" }}>Displaying {type.label} files is not supported in the browser.</p>
        </div>
        <a className="btn btn-primary" href={downloadUrl} download={doc.originalName}>
          <Download size={16} />
          Download to View
        </a>
      </div>
    );
  };

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '1000px', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div className="nc-modal-header" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
             <span style={{ fontSize: "1.2rem" }}>{type.icon}</span>
             <h3 style={{ fontSize: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }} title={doc.originalName}>{doc.originalName}</h3>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ width: '32px', height: '32px', padding: 0 }}><X size={18} /></button>
        </div>

        {/* Preview */}
        <div style={{ padding: 'var(--space-6)', background: 'var(--color-bg-base)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
           {renderPreview()}
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-surface)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            <span className="badge badge-ghost" style={{ marginRight: 'var(--space-3)' }}>{type.label}</span>
            {formatBytes(doc.fileSizeBytes)} · {formatDate(doc.uploadedAt)}
            {doc.folderName && <span> · 📁 {doc.folderName}</span>}
          </div>
          <a className="btn btn-secondary" href={downloadUrl} download={doc.originalName}>
            <Download size={14} />
            Download File
          </a>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
