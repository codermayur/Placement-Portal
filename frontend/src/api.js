import axios from "axios";

// API must point to backend server, not relative path
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

// Add request interceptor to ensure auth token is always included
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("placement_auth");
    if (token) {
      try {
        const auth = JSON.parse(token);
        if (auth?.token) {
          config.headers.Authorization = `Bearer ${auth.token}`;
          console.log(`[API] Request: ${config.method.toUpperCase()} ${config.url} with auth token`);
        } else {
          console.warn(`[API] Request: ${config.method.toUpperCase()} ${config.url} - No valid token in storage`);
        }
      } catch (e) {
        console.error("[API] Invalid auth storage JSON - clearing localStorage");
        localStorage.removeItem("placement_auth");
      }
    } else {
      console.log(`[API] Request: ${config.method.toUpperCase()} ${config.url} - No token (public endpoint?)`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for detailed error logging and global error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API ✓] Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const data = error.response?.data;

    if (status === 401) {
      console.error(`[API 401 UNAUTH] ${method} ${url}`, data);
      // Clear invalid token
      localStorage.removeItem("placement_auth");
      // Optional: redirect to login
    } else if (status === 403) {
      console.error(`[API 403 FORBIDDEN] ${method} ${url}`, data, {
        reason: "Check role/verification/department permissions",
        message: data?.message
      });
    } else if (status === 500) {
      console.error(`[API 500 ERROR] ${method} ${url}`, {
        message: data?.message,
        details: data?.details,
      });
    } else if (!status) {
      console.error(`[API ERROR] Network/CORS issue on ${method} ${url}`, error.message);
    } else {
      console.error(`[API ${status}] ${method} ${url}`, data);
    }

    return Promise.reject(error);
  }
);

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
