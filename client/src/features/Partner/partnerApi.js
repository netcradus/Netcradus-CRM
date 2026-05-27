import axios from "axios";
import { apiUrl } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// Partner APIs stay under /api/partner so external users do not touch employee module endpoints.
export const partnerApi = {
  dashboard: () => axios.get(apiUrl("/api/partner/dashboard"), { headers: authHeaders() }),
  notifications: () => axios.get(apiUrl("/api/notifications?limit=20"), { headers: authHeaders() }),
  vendors: () => axios.get(apiUrl("/api/partner/vendors"), { headers: authHeaders() }),
  createVendor: (payload) => axios.post(apiUrl("/api/partner/vendors"), payload, { headers: authHeaders() }),
  updateVendor: (id, payload) => axios.patch(apiUrl(`/api/partner/vendors/${id}`), payload, { headers: authHeaders() }),
  deactivateVendor: (id) => axios.patch(apiUrl(`/api/partner/vendors/${id}/deactivate`), {}, { headers: authHeaders() }),
  setVendorStatus: (id, status) => axios.patch(apiUrl(`/api/partner/vendors/${id}/deactivate`), { status }, { headers: authHeaders() }),
  projects: () => axios.get(apiUrl("/api/partner/projects"), { headers: authHeaders() }),
  createProject: (payload) => axios.post(apiUrl("/api/partner/projects"), payload, { headers: authHeaders() }),
  project: (id) => axios.get(apiUrl(`/api/partner/projects/${id}`), { headers: authHeaders() }),
  updateNotes: (id, payload) => axios.patch(apiUrl(`/api/partner/projects/${id}/notes`), payload, { headers: authHeaders() }),
  uploadFile: (id, formData) => axios.post(apiUrl(`/api/partner/projects/${id}/files`), formData, { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } }),
  adminPartners: () => axios.get(apiUrl("/api/partner/admin/partners"), { headers: authHeaders() }),
  adminPartner: (id) => axios.get(apiUrl(`/api/partner/admin/partners/${id}`), { headers: authHeaders() }),
};

export const statusLabel = (status = "") =>
  String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const statusColors = {
  new: ["#f3f4f6", "#374151"],
  under_review: ["#dbeafe", "#1d4ed8"],
  approved: ["#ccfbf1", "#0f766e"],
  in_progress: ["#fef3c7", "#b45309"],
  testing: ["#ede9fe", "#6d28d9"],
  completed: ["#dcfce7", "#15803d"],
  on_hold: ["#ffedd5", "#c2410c"],
  cancelled: ["#fee2e2", "#b91c1c"],
};

export function StatusBadge({ status, large = false }) {
  const [bg, color] = statusColors[status] || statusColors.new;
  return (
    <span className="badge" style={{ background: bg, color, fontSize: large ? "var(--text-base)" : "var(--text-xs)", padding: large ? "var(--space-2) var(--space-4)" : undefined }}>
      {statusLabel(status)}
    </span>
  );
}
