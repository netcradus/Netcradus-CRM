import React, { useState } from "react";
import {
  Search, LayoutGrid, List, Upload, ChevronLeft, ChevronRight, FileQuestion
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
  { label: "Newest First", value: "date" },
  { label: "Name (A-Z)", value: "name" },
  { label: "Size (Large First)", value: "size" },
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
      <div style={{ display: "flex", alignItems: "center", gap: 'var(--space-4)', justifyContent: "center", padding: "var(--space-6) 0" }}>
        <button
          className="btn btn-ghost"
          style={{ width: '32px', height: '32px', padding: 0 }}
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 'var(--font-medium)' }}>
          Page {pagination.page} of {pagination.pages}
        </span>
        <button
          className="btn btn-ghost"
          style={{ width: '32px', height: '32px', padding: 0 }}
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ 
        padding: 'var(--space-4)', 
        borderBottom: '1px solid var(--color-border)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        background: 'var(--color-bg-surface)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '36px', height: '36px' }}
            type="text"
            placeholder={`Search in ${folderName}…`}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {MIME_FILTERS.map(f => (
            <button
              key={f.value}
              className={`btn btn--sm ${mimeFilter === f.value ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '10px' }}
              onClick={() => onMimeFilterChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className="form-select"
          style={{ width: '150px', height: '36px', fontSize: 'var(--text-xs)' }}
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '2px', background: 'var(--color-bg-base)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn--sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ width: '32px', padding: 0 }}
            onClick={() => onViewModeChange("grid")}
          ><LayoutGrid size={14} /></button>
          <button
            className={`btn btn--sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ width: '32px', padding: 0 }}
            onClick={() => onViewModeChange("list")}
          ><List size={14} /></button>
        </div>
      </div>

      {/* File content area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-20)' }}>
             <div className="btn-spinner" style={{ width: '24px', height: '24px', borderTopColor: 'var(--color-accent)' }} />
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <FileQuestion size={48} className="icon" />
            <p>{search ? "No files match your search." : "No files here yet. Upload your first file."}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
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
          <div className="nc-table-wrapper">
            <table className="nc-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Format</th>
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
    </div>
  );
};

export default FileListPanel;
