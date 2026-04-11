import React from "react";
import { X, Download } from "lucide-react";
import { isImage, isPDF, getFileType, formatBytes, formatDate, getViewUrl, getDownloadUrl } from "./fileHelpers";

const FileViewer = ({ doc, onClose }) => {
  const type = getFileType(doc.mimeType);
  const viewUrl = getViewUrl(doc._id);
  const downloadUrl = getDownloadUrl(doc._id);

  const renderPreview = () => {
    if (isImage(doc.mimeType)) {
      return <img src={viewUrl} alt={doc.originalName} />;
    }
    if (isPDF(doc.mimeType)) {
      return <iframe src={viewUrl} title={doc.originalName} />;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 40, color: "var(--nc-text-muted)" }}>
        <span style={{ fontSize: "3rem" }}>{type.icon}</span>
        <p style={{ fontSize: "0.9rem" }}>Preview not available for {type.label} files.</p>
        <a className="drive-btn drive-btn-primary" href={downloadUrl} download={doc.originalName}>
          <Download size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Download to View
        </a>
      </div>
    );
  };

  return (
    <div className="drive-modal-overlay" onClick={onClose}>
      <div className="drive-modal viewer-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="viewer-modal-header">
          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{type.icon}</span>
          <h3 title={doc.originalName}>{doc.originalName}</h3>
          <button className="drive-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Preview */}
        <div className="viewer-modal-body">{renderPreview()}</div>

        {/* Footer */}
        <div className="viewer-modal-footer">
          <div className="viewer-meta">
            {type.label} · {formatBytes(doc.fileSizeBytes)} · {formatDate(doc.uploadedAt)}
            {doc.folderName && <span> · 📂 {doc.folderName}</span>}
          </div>
          <a className="drive-btn drive-btn-ghost" style={{ marginLeft: "auto" }} href={downloadUrl} download={doc.originalName}>
            <Download size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Download
          </a>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
