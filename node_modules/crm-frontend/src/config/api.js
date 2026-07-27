const RAW_API_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "";

const API_URL = RAW_API_URL.replace(/\/+$/, "");

const apiUrl = (path = "") => {
  if (!path) return API_URL;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/api" || normalizedPath.startsWith("/api/")) {
    if (!API_URL || API_URL === "/api") {
      return normalizedPath;
    }
    const apiRoot = API_URL.replace(/\/api$/i, "");
    return apiRoot ? `${apiRoot}${normalizedPath}` : normalizedPath;
  }

  if (!API_URL) {
    return `/api${normalizedPath}`;
  }

  return API_URL.endsWith("/api")
    ? `${API_URL}${normalizedPath}`
    : `${API_URL}/api${normalizedPath}`;
};

export { API_URL, apiUrl };

