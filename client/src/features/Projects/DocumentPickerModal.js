import { useEffect, useMemo, useState } from "react";
import { FileText, Search, X } from "lucide-react";
import { projectApi } from "./projectApi";

export default function DocumentPickerModal({ open, projectId, onClose, onAttached, onSelect, password }) {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await projectApi.documents({ limit: 100 });
        setFiles(data.data || []);
      } catch (err) {
        setError("Could not load Drive files.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return files;
    return files.filter((file) => (file.originalName || file.safeName || "").toLowerCase().includes(term));
  }, [files, search]);

  if (!open) return null;

  const attach = async (file) => {
    const payload = {
      driveFileId: file._id,
      fileName: file.originalName || file.safeName || "Untitled file",
      fileSizeMB: file.fileSizeMB || 0,
    };
    if (!projectId) {
      onSelect?.(payload);
      onClose();
      return;
    }
    const { data } = await projectApi.attachDocument(projectId, payload, password);
    onAttached(data.documents || []);
    onClose();
  };

  return (
    <div className="portfolio-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="portfolio-modal portfolio-document-picker">
        <div className="portfolio-modal-head">
          <h3>Attach Document</h3>
          <button type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="portfolio-search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Drive files" />
        </div>
        {error && <p className="portfolio-form-error">{error}</p>}
        <div className="portfolio-file-list">
          {loading ? (
            <p className="portfolio-muted">Loading files...</p>
          ) : filtered.length ? (
            filtered.map((file) => (
              <button key={file._id} type="button" className="portfolio-file-option" onClick={() => attach(file)}>
                <FileText size={18} />
                <span>{file.originalName || file.safeName}</span>
                <small>{Number(file.fileSizeMB || 0).toFixed(2)} MB</small>
              </button>
            ))
          ) : (
            <p className="portfolio-muted">No files found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
