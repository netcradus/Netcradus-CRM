// Shared file helpers used by FileCard, FileRow, FileViewer
import { apiUrl } from "../../config/api";

export const FILE_TYPE_MAP = {
  "application/pdf": { icon: "📄", color: "#ef4444", label: "PDF" },
  "application/msword": { icon: "📝", color: "#3b82f6", label: "Word" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: "📝", color: "#3b82f6", label: "Word" },
  "application/vnd.ms-excel": { icon: "📊", color: "#22c55e", label: "Excel" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { icon: "📊", color: "#22c55e", label: "Excel" },
  "application/vnd.ms-powerpoint": { icon: "📽️", color: "#f59e0b", label: "PPT" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { icon: "📽️", color: "#f59e0b", label: "PPT" },
  "text/plain": { icon: "📃", color: "#8892a4", label: "Text" },
  "text/csv": { icon: "📋", color: "#22c55e", label: "CSV" },
  "image/jpeg": { icon: "🖼️", color: "#a855f7", label: "Image" },
  "image/png": { icon: "🖼️", color: "#a855f7", label: "Image" },
  "image/webp": { icon: "🖼️", color: "#a855f7", label: "Image" },
  "image/gif": { icon: "🖼️", color: "#a855f7", label: "GIF" },
};

export const ALLOWED_MIME_TYPES = Object.keys(FILE_TYPE_MAP);

export const getFileType = (mimeType) =>
  FILE_TYPE_MAP[mimeType] || { icon: "📁", color: "#8892a4", label: "File" };

export const isImage = (mimeType) => mimeType?.startsWith("image/");
export const isPDF = (mimeType) => mimeType === "application/pdf";

export const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const getViewUrl = (docId) =>
  apiUrl(`/api/documents/view/${docId}?token=${localStorage.getItem("token")}`);

export const getDownloadUrl = (docId) =>
  apiUrl(`/api/documents/download/${docId}?token=${localStorage.getItem("token")}`);
