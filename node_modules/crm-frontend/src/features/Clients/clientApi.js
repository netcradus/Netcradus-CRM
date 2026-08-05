import axios from "axios";
import { apiUrl } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const clientApi = {
  list: (params) =>
    axios.get(apiUrl("/api/clients"), { headers: authHeaders(), params }),
  stats: () =>
    axios.get(apiUrl("/api/clients/stats"), { headers: authHeaders() }),
  get: (id) =>
    axios.get(apiUrl(`/api/clients/${id}`), { headers: authHeaders() }),
  create: (payload) =>
    axios.post(apiUrl("/api/clients"), payload, { headers: authHeaders() }),
  update: (id, payload) =>
    axios.put(apiUrl(`/api/clients/${id}`), payload, { headers: authHeaders() }),
  archive: (id) =>
    axios.patch(apiUrl(`/api/clients/${id}/archive`), {}, { headers: authHeaders() }),
  remove: (id) =>
    axios.delete(apiUrl(`/api/clients/${id}`), { headers: authHeaders() }),
  addNote: (id, message) =>
    axios.post(apiUrl(`/api/clients/${id}/notes`), { message }, { headers: authHeaders() }),
  users: () =>
    axios.get(apiUrl("/api/projects/users"), { headers: authHeaders() }),
  enableSupport: (id, payload) =>
    axios.post(apiUrl(`/api/clients/${id}/support-access`), payload, { headers: authHeaders() }),
  resetSupportPassword: (id, userId, payload) =>
    axios.patch(apiUrl(`/api/clients/${id}/support-access/${userId}/reset-password`), payload, { headers: authHeaders() }),
  suspendSupport: (id, userId) =>
    axios.patch(apiUrl(`/api/clients/${id}/support-access/${userId}/suspend`), {}, { headers: authHeaders() }),
  reEnableSupport: (id, userId) =>
    axios.patch(apiUrl(`/api/clients/${id}/support-access/${userId}/activate`), {}, { headers: authHeaders() }),
  contacts: (clientId) =>
    axios.get(apiUrl(`/api/clients/${clientId}/contacts`), { headers: authHeaders() }),
  createContact: (clientId, payload) =>
    axios.post(apiUrl(`/api/clients/${clientId}/contacts`), payload, { headers: authHeaders() }),
  updateContact: (clientId, contactId, payload) =>
    axios.put(apiUrl(`/api/clients/${clientId}/contacts/${contactId}`), payload, { headers: authHeaders() }),
  makeContactPrimary: (clientId, contactId) =>
    axios.patch(apiUrl(`/api/clients/${clientId}/contacts/${contactId}/primary`), {}, { headers: authHeaders() }),
  patchContactStatus: (clientId, contactId, status) =>
    axios.patch(apiUrl(`/api/clients/${clientId}/contacts/${contactId}/status`), { status }, { headers: authHeaders() }),
  deleteContact: (clientId, contactId) =>
    axios.delete(apiUrl(`/api/clients/${clientId}/contacts/${contactId}`), { headers: authHeaders() }),
  enableContactSupport: (clientId, contactId, payload) =>
    axios.post(apiUrl(`/api/clients/${clientId}/contacts/${contactId}/support-access`), payload, { headers: authHeaders() }),
  suspendContactSupport: (clientId, contactId) =>
    axios.patch(apiUrl(`/api/clients/${clientId}/contacts/${contactId}/support-access/suspend`), {}, { headers: authHeaders() }),
  projects: (clientId, params) =>
    axios.get(apiUrl(`/api/clients/${clientId}/projects`), { headers: authHeaders(), params }),
};
