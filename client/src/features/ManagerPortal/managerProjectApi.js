import axios from "axios";
import { apiUrl } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const managerProjectApi = {
  list: (params) => axios.get(apiUrl("/api/manager/projects"), { headers: authHeaders(), params }),
  get: (id) => axios.get(apiUrl(`/api/manager/projects/${id}`), { headers: authHeaders() }),
  create: (payload) => axios.post(apiUrl("/api/manager/projects"), payload, { headers: authHeaders() }),
  update: (id, payload) => axios.patch(apiUrl(`/api/manager/projects/${id}`), payload, { headers: authHeaders() }),
  team: () => axios.get(apiUrl("/api/manager/team"), { headers: authHeaders() }),
};
