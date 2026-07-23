import axios from "axios";
import { apiUrl } from "../config/api";

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getHierarchy = () => axios.get(apiUrl("/api/org-hierarchy"), authConfig());
export const addToHierarchy = (data) => axios.post(apiUrl("/api/org-hierarchy"), data, authConfig());
export const updateHierarchyNode = (id, data) =>
  axios.put(apiUrl(`/api/org-hierarchy/${id}`), data, authConfig());
export const bulkUpdateHierarchy = (nodes) =>
  axios.put(apiUrl("/api/org-hierarchy/bulk-update"), { nodes }, authConfig());
export const deleteHierarchyNode = (id) =>
  axios.delete(apiUrl(`/api/org-hierarchy/${id}`), authConfig());
export const getAssignableUsers = () => axios.get(apiUrl("/api/org-hierarchy/assignable-users"), authConfig());
