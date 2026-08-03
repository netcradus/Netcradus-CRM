import axios from "axios";
import { apiUrl } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const riskApi = {
  list: (params = {}) =>
    axios.get(apiUrl("/api/risks"), {
      headers: authHeaders(),
      params,
    }),
  get: (id) =>
    axios.get(apiUrl(`/api/risks/${id}`), {
      headers: authHeaders(),
    }),
  create: (payload) =>
    axios.post(apiUrl("/api/risks"), payload, {
      headers: authHeaders(),
    }),
  update: (id, payload) =>
    axios.put(apiUrl(`/api/risks/${id}`), payload, {
      headers: authHeaders(),
    }),
  delete: (id) =>
    axios.delete(apiUrl(`/api/risks/${id}`), {
      headers: authHeaders(),
    }),
  getAssignableUsers: () =>
    axios.get(apiUrl("/api/tasks/assignable-users"), {
      headers: authHeaders(),
    }),
};
