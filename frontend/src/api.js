import axios from "axios";

const baseURL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || "/api"
  : import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
});

export const extractApiData = (response) => response?.data?.data ?? response?.data ?? null;
export const extractApiError = (error, fallbackMessage) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  fallbackMessage;

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

export default api;
