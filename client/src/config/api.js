const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

const apiUrl = (path = "") => {
  if (!path) return API_URL;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiRoot = API_URL.replace(/\/api$/i, "");

  if (normalizedPath === "/api" || normalizedPath.startsWith("/api/")) {
    return `${apiRoot}${normalizedPath}`;
  }

  return `${API_URL}${normalizedPath}`;
};

export { API_URL, apiUrl };

