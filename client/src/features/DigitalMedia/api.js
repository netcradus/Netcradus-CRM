import axios from "axios";
import { apiUrl } from "../../config/api";

export const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

export const dmApi = {
  get: (path, config = {}) => axios.get(apiUrl(path), { ...getAuthConfig(), ...config }),
  post: (path, data = {}, config = {}) => axios.post(apiUrl(path), data, { ...getAuthConfig(), ...config }),
  put: (path, data = {}, config = {}) => axios.put(apiUrl(path), data, { ...getAuthConfig(), ...config }),
  patch: (path, data = {}, config = {}) => axios.patch(apiUrl(path), data, { ...getAuthConfig(), ...config }),
  delete: (path, config = {}) => axios.delete(apiUrl(path), { ...getAuthConfig(), ...config }),
};

export const formatDate = (value, options = {}) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
};

export const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const truncate = (value, limit = 60) => {
  const text = String(value || "");
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
};

export const getMonthBounds = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

export const getWeekDates = (anchorDate = new Date()) => {
  const date = new Date(anchorDate);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return current;
  });
};

export const sameDay = (left, right) => {
  const first = new Date(left);
  const second = new Date(right);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

export const isApproverRole = () => {
  const role = String(localStorage.getItem("userRole") || "").trim().toLowerCase();
  return ["admin", "hr", "super_user"].includes(role);
};
