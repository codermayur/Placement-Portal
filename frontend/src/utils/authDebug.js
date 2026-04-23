/**
 * Auth Debug Logging Utility
 * Provides consistent, timestamped logging for authentication flow debugging
 * Enable with: localStorage.setItem('AUTH_DEBUG', 'true')
 */

const DEBUG_KEY = "AUTH_DEBUG";
const isDev = import.meta.env.DEV;

const isDebugEnabled = () => {
  if (typeof localStorage === "undefined") return isDev;
  return localStorage.getItem(DEBUG_KEY) === "true" || isDev;
};

const timestamp = () => new Date().toLocaleTimeString("en-US", {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3
});

export const authDebug = {
  /**
   * Log authentication state changes
   */
  authState: (context, token, user) => {
    if (!isDebugEnabled()) return;
    console.group(`%c[AUTH STATE] ${timestamp()}`, "color: #6366f1; font-weight: bold");
    console.log("Context:", context);
    console.log("Token:", token ? `${token.substring(0, 20)}...` : "none");
    console.log("User:", user?.email || user?.studentId || "none");
    console.groupEnd();
  },

  /**
   * Log token operations
   */
  tokenOp: (operation, token, details = {}) => {
    if (!isDebugEnabled()) return;
    const status = details.status || "✓";
    const color = details.error ? "#ef4444" : "#10b981";
    console.log(
      `%c[TOKEN ${operation}] ${timestamp()} ${status}`,
      `color: ${color}; font-weight: bold`,
      details
    );
  },

  /**
   * Log API request/response
   */
  apiCall: (method, url, status, details = {}) => {
    if (!isDebugEnabled()) return;
    const statusColor = status >= 400 ? "#ef4444" : "#10b981";
    console.log(
      `%c[API ${method} ${url}] ${timestamp()} ${status}`,
      `color: ${statusColor}; font-weight: bold`,
      details
    );
  },

  /**
   * Log socket connection events
   */
  socket: (event, details = {}) => {
    if (!isDebugEnabled()) return;
    const color = event.includes("error") || event.includes("Error") ? "#ef4444" : "#3b82f6";
    console.log(
      `%c[SOCKET ${event}] ${timestamp()}`,
      `color: ${color}; font-weight: bold`,
      details
    );
  },

  /**
   * Log context operations
   */
  context: (operation, data = {}) => {
    if (!isDebugEnabled()) return;
    console.log(
      `%c[CONTEXT ${operation}] ${timestamp()}`,
      "color: #8b5cf6; font-weight: bold",
      data
    );
  },

  /**
   * Enable debug mode
   */
  enable: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEBUG_KEY, "true");
      console.log("%c[AUTH DEBUG] Enabled", "color: #10b981; font-weight: bold");
    }
  },

  /**
   * Disable debug mode
   */
  disable: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(DEBUG_KEY);
      console.log("%c[AUTH DEBUG] Disabled", "color: #ef4444; font-weight: bold");
    }
  },

  /**
   * Print full auth flow (for testing)
   */
  printFlow: () => {
    console.log(
      "%c=== AUTH DEBUG FLOW ===\n\n" +
      "Commands:\n" +
      "  authDebug.enable()   - Enable debug logging\n" +
      "  authDebug.disable()  - Disable debug logging\n\n" +
      "Expected flow:\n" +
      "  1. User submits LoginPage form\n" +
      "  2. API POST /auth/login with credentials\n" +
      "  3. Backend returns { accessToken, user }\n" +
      "  4. LoginPage extracts data.accessToken (NOT data.token)\n" +
      "  5. AuthContext.login(token, user) called\n" +
      "  6. setAccessToken(token) sets token in memory\n" +
      "  7. initSocket() connects with token in handshake.auth\n" +
      "  8. Socket connects successfully\n\n" +
      "On logout:\n" +
      "  1. User clicks logout\n" +
      "  2. logout() called in AuthContext\n" +
      "  3. clearAccessToken() clears token\n" +
      "  4. disconnectSocket() closes socket\n" +
      "  5. auth state reset\n\n" +
      "On token refresh:\n" +
      "  1. API receives 401 Unauthorized\n" +
      "  2. POST /auth/refresh with httpOnly cookie\n" +
      "  3. Backend returns new { accessToken }\n" +
      "  4. apiClient updates token in memory\n" +
      "  5. Dispatch 'auth:token-refreshed' event\n" +
      "  6. Socket listens and reconnects with new token\n" +
      "  7. Original request retried with new token",
      "color: #6366f1; font-weight: bold; font-size: 12px"
    );
  },
};

export default authDebug;
