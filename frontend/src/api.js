/**
 * DEPRECATED: This file is deprecated in favor of utils/apiClient.js
 *
 * The new apiClient.js provides:
 * - Access tokens stored in memory (React state/context) instead of localStorage
 * - Automatic refresh token handling via httpOnly cookies
 * - Automatic retry on 401 with token refresh
 * - Better security practices
 *
 * For new code, import from 'src/utils/apiClient' instead:
 * import api, { setAccessToken, clearAccessToken, getAccessToken } from '@/utils/apiClient'
 */

import axios from "axios";
import { setAccessToken, clearAccessToken, extractApiData, extractApiError } from "./utils/apiClient";

// API must point to backend server, not relative path
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

// Add request interceptor to ensure auth token is added only to protected routes
// PUBLIC ROUTES (no auth header): /auth/login, /auth/register, /auth/verify-otp, /auth/forgot-password
api.interceptors.request.use(
  (config) => {
    // Public auth routes - do NOT add authorization header
    const publicRoutes = ["/auth/login", "/auth/register", "/auth/verify-otp", "/auth/forgot-password"];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));

    if (isPublicRoute) {
      // Remove any existing Authorization header for public routes
      delete config.headers.Authorization;
      if (process.env.NODE_ENV === "development") {
        console.log(`[API] Request: ${config.method.toUpperCase()} ${config.url} - PUBLIC ROUTE (no auth header)`);
      }
      return config;
    }

    // Protected routes - add authorization header if token exists
    const token = localStorage.getItem("placement_auth");
    if (token) {
      try {
        const auth = JSON.parse(token);
        if (auth?.token) {
          config.headers.Authorization = `Bearer ${auth.token}`;
          // Also set in memory via apiClient
          setAccessToken(auth.token);
          console.log(`[API] Request: ${config.method.toUpperCase()} ${config.url} with auth token`);
        } else {
          console.warn(`[API] Request: ${config.method.toUpperCase()} ${config.url} - No valid token in storage`);
        }
      } catch (e) {
        console.error("[API] Invalid auth storage JSON - clearing localStorage");
        localStorage.removeItem("placement_auth");
      }
    } else {
      console.log(`[API] Request: ${config.method.toUpperCase()} ${config.url} - No token`);
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
      clearAccessToken();
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

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setAccessToken(token);
    localStorage.setItem("placement_auth", JSON.stringify({ token }));
    console.warn("[DEPRECATED] setAuthToken - use apiClient.setAccessToken instead");
  } else {
    delete api.defaults.headers.common.Authorization;
    clearAccessToken();
    localStorage.removeItem("placement_auth");
  }
};

export { extractApiData, extractApiError };

export default api;
