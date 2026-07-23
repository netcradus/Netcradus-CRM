import axios from "axios";
import { apiUrl } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

export const internalMailApi = {
  // Inbox, Sent, Drafts, Deleted
  getInbox: () => axios.get(apiUrl("/api/internal-mail/inbox"), { headers: authHeaders() }),
  getSent: () => axios.get(apiUrl("/api/internal-mail/sent"), { headers: authHeaders() }),
  getDrafts: () => axios.get(apiUrl("/api/internal-mail/drafts"), { headers: authHeaders() }),
  getDeleted: () => axios.get(apiUrl("/api/internal-mail/deleted"), { headers: authHeaders() }),
  
  // Unread badge count
  getUnreadCount: () => axios.get(apiUrl("/api/internal-mail/unread-count"), { headers: authHeaders() }),
  
  // User directory
  getUsers: () => axios.get(apiUrl("/api/internal-mail/users"), { headers: authHeaders() }),
  
  // Mail actions
  getMail: (mailId) => axios.get(apiUrl(`/api/internal-mail/${mailId}`), { headers: authHeaders() }),
  sendMail: (formData) => axios.post(apiUrl("/api/internal-mail"), formData, { 
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } 
  }),
  saveDraft: (formData) => axios.post(apiUrl("/api/internal-mail/draft"), formData, { 
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } 
  }),
  updateDraft: (mailId, formData) => axios.put(apiUrl(`/api/internal-mail/draft/${mailId}`), formData, { 
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } 
  }),
  
  // States toggle
  toggleRead: (mailId, isRead) => axios.patch(apiUrl(`/api/internal-mail/${mailId}/read`), { isRead }, { headers: authHeaders() }),
  toggleStar: (mailId, isStarred) => axios.patch(apiUrl(`/api/internal-mail/${mailId}/star`), { isStarred }, { headers: authHeaders() }),
  softDelete: (mailId) => axios.patch(apiUrl(`/api/internal-mail/${mailId}/delete`), {}, { headers: authHeaders() }),
  restoreMail: (mailId) => axios.patch(apiUrl(`/api/internal-mail/${mailId}/restore`), {}, { headers: authHeaders() }),
  
  // Attachment URL
  getDownloadUrl: (mailId, attachmentId) => apiUrl(`/api/internal-mail/${mailId}/attachment/${attachmentId}/download`)
};
