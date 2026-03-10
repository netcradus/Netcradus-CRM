const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const apiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export { API_BASE_URL, apiUrl };

