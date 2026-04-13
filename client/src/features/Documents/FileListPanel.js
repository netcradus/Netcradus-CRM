import React, { useState } from "react";
import {
  Search, Grid, List, Upload, ChevronLeft, ChevronRight
} from "lucide-react";
import FileCard from "./FileCard";
import FileRow from "./FileRow";
import FileViewer from "./FileViewer";

const MIME_FILTERS = [
  { label: "All", value: "" },
  { label: "Images", value: "image/" },
  { label: "PDFs", value: "application/pdf" },
  { label: "Docs", value: "wordprocessing" },
  { label: "Sheets", value: "spreadsheet" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "date" },
  { label: "Name", value: "name" },
  { label: "Size", value: "size" },
];

const FileListPanel = ({
  files, loading, viewMode, search, mimeFilter, sortBy, folderName,
  storage, pagination, onSearchChange, onMimeFilterChange, onSortChange,
  onViewModeChange, onUploadClick, onDeleteFile, onRenameFile, onMoveFile,
  onPageChange,
}) => {
  const [viewerDoc, setViewerDoc] = useState(null);

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", padding: "12px 0" }}>
        <button
          className="file-action-btn"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: "0.78rem", color: "var(--nc-text-muted)" }}>
          Page {pagination.page} of {pagination.pages} ({pagination.total} files)
        </span>
        <button
          className="file-action-btn"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Toolbar */}
      <div className="drive-toolbar">
        <div className="drive-search-wrap">
          <Search size={14} className="drive-search-icon" />
          <input
            className="drive-search"
            type="text"
            placeholder={`Search in ${folderName}…`}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        <div className="drive-filter-row">
          {MIME_FILTERS.map(f => (
            <button
              key={f.value}
              className={`drive-filter-chip ${mimeFilter === f.value ? "active" : ""}`}
              onClick={() => onMimeFilterChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className="drive-sort-select"
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="drive-view-toggle">
          <button
            className={`drive-view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => onViewModeChange("grid")}
            title="Grid view"
          ><Grid size={15} /></button>
          <button
            className={`drive-view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => onViewModeChange("list")}
            title="List view"
          ><List size={15} /></button>
        </div>

        <button className="drive-upload-btn" onClick={onUploadClick}>
          <Upload size={14} /> Upload
        </button>
      </div>

      {/* File content area */}
      <div className="drive-files-scroll">
        {loading ? (
          <div className="drive-loading"><div className="drive-spinner" /><span>Loading…</span></div>
        ) : files.length === 0 ? (
          <div className="drive-empty">
            <div className="drive-empty-icon">📂</div>
            <p>{search ? "No files match your search." : "No files here yet. Upload your first file."}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="drive-grid">
            {files.map(f => (
              <FileCard
                key={f._id}
                doc={f}
                storage={storage}
                onView={() => setViewerDoc(f)}
                onDelete={() => onDeleteFile(f._id, f.originalName)}
                onRename={(newName) => onRenameFile(f._id, newName)}
                onMove={(targetFolderId, targetName) => onMoveFile(f._id, targetFolderId, targetName)}
              />
            ))}
          </div>
        ) : (
          <div className="drive-list-table-wrap">
            <table className="drive-list-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <FileRow
                    key={f._id}
                    doc={f}
                    storage={storage}
                    onView={() => setViewerDoc(f)}
                    onDelete={() => onDeleteFile(f._id, f.originalName)}
                    onRename={(newName) => onRenameFile(f._id, newName)}
                    onMove={(targetFolderId, targetName) => onMoveFile(f._id, targetFolderId, targetName)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && renderPagination()}
      </div>

      {viewerDoc && (
        <FileViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />
      )}
    </>
  );
};

export default FileListPanel;
