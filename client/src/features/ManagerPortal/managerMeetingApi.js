import axios from "axios";
import { apiUrl } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const managerMeetingApi = {
  list: (params) => axios.get(apiUrl("/api/manager/meetings"), { headers: authHeaders(), params }),
  get: (meetingId) => axios.get(apiUrl(`/api/manager/meetings/${meetingId}`), { headers: authHeaders() }),
  create: (payload) => axios.post(apiUrl("/api/manager/meetings"), payload, { headers: authHeaders() }),
  update: (meetingId, payload) => axios.patch(apiUrl(`/api/manager/meetings/${meetingId}`), payload, { headers: authHeaders() }),
  cancel: (meetingId, cancelReason) => axios.patch(apiUrl(`/api/manager/meetings/${meetingId}/cancel`), { cancelReason }, { headers: authHeaders() }),
  team: () => axios.get(apiUrl("/api/manager/team"), { headers: authHeaders() }),
  projects: () => axios.get(apiUrl("/api/manager/projects"), { headers: authHeaders() }),
};
