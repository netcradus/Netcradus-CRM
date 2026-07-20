import axios from "axios";
import { apiUrl } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const broadcastApi = {
  list: () => axios.get(apiUrl("/api/broadcasts"), { headers: authHeaders() }),
  get: (id) => axios.get(apiUrl(`/api/broadcasts/${id}`), { headers: authHeaders() }),
  create: (payload) => axios.post(apiUrl("/api/broadcasts"), payload, { headers: authHeaders() }),
  markRead: (id) => axios.patch(apiUrl(`/api/broadcasts/${id}/read`), {}, { headers: authHeaders() }),
  getUsers: () => axios.get(apiUrl("/api/tasks/assignable-users"), { headers: authHeaders() })
};
