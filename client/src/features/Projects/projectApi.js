import axios from "axios";
import { apiUrl } from "../../config/api";

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const projectAssetUrl = (id) => {
  if (!id) return "";
  const token = localStorage.getItem("token");
  return `${apiUrl(`/api/documents/view/${id}`)}${token ? `?token=${token}` : ""}`;
};

export const projectApi = {
  list: (params) => axios.get(apiUrl("/api/projects"), { headers: authHeaders(), params }),
  get: (id) => axios.get(apiUrl(`/api/projects/${id}`), { headers: authHeaders() }),
  create: (payload) => axios.post(apiUrl("/api/projects"), payload, { headers: authHeaders() }),
  update: (id, payload, password) =>
    axios.patch(apiUrl(`/api/projects/${id}`), { ...payload, password }, { headers: authHeaders() }),
  remove: (id, password) =>
    axios.delete(apiUrl(`/api/projects/${id}`), { headers: authHeaders(), data: { password } }),
  showcase: () => axios.get(apiUrl("/api/projects/showcase"), { headers: authHeaders() }),
  verifyPassword: (password) =>
    axios.post(apiUrl("/api/projects/verify-password"), { password }, { headers: authHeaders() }),
  updateSensitive: (id, sensitiveFields, password) =>
    axios.patch(apiUrl(`/api/projects/${id}/sensitive`), { sensitiveFields, password }, { headers: authHeaders() }),
  toggleShowcase: (id, password) =>
    axios.patch(apiUrl(`/api/projects/${id}/showcase`), { password }, { headers: authHeaders() }),
  toggleFeatured: (id, password) =>
    axios.patch(apiUrl(`/api/projects/${id}/featured`), { password }, { headers: authHeaders() }),
  attachDocument: (id, payload, password) =>
    axios.post(apiUrl(`/api/projects/${id}/documents`), { ...payload, password }, { headers: authHeaders() }),
  removeDocument: (id, driveFileId, password) =>
    axios.delete(apiUrl(`/api/projects/${id}/documents/${driveFileId}`), { headers: authHeaders(), data: { password } }),
  documents: (params) => axios.get(apiUrl("/api/documents/files"), { headers: authHeaders(), params }),
};
