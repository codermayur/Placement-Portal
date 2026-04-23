import { io } from "socket.io-client";
import { getAccessToken, getSocketUrl } from "./apiClient";
import { authDebug } from "./authDebug";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize Socket.IO connection with JWT authentication
 *
 * SECURITY:
 * - Token passed only once during handshake (not in every request)
 * - httpOnly cookies not used (token in memory only)
 * - WebSocket transport only (no fallback to polling)
 * - Proper error handling for token expiration
 * - Auto-reconnect with exponential backoff
 *
 * @returns {Promise<Socket>} Socket instance
 */
export const initSocket = () => {
  // Return existing socket instance (connecting or connected)
  if (socket) {
    authDebug.socket("ALREADY_CONNECTED", { socketId: socket.id, connected: socket?.connected });
    console.log("[SOCKET] Socket instance already exists:", socket.id || "connecting...");
    return socket;
  }

  const SOCKET_URL = getSocketUrl();
  const accessToken = getAccessToken();

  if (!accessToken) {
    console.error("[SOCKET INIT FAILED] No access token available");
    authDebug.socket("INIT_FAILED", { reason: "no_token" });
    return null;
  }

  // Ensure token is a string
  const tokenString = typeof accessToken === "string" ? accessToken : String(accessToken);

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[SOCKET INIT] Creating connection\n" +
      `  Server: ${SOCKET_URL}\n` +
      `  Token length: ${tokenString.length} chars\n` +
      `  Token preview: ${tokenString.substring(0, 20)}...`
    );
  }

  socket = io(SOCKET_URL, {
    // SECURITY: Pass JWT token in auth for Socket.io middleware authentication
    auth: {
      token: tokenString
    },
    reconnection: true,
    reconnectionDelay: 1000,           // 1 second initial delay
    reconnectionDelayMax: 5000,        // Max 5 seconds delay
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    withCredentials: true,             // Include cookies in requests
    transports: ["websocket"],         // WebSocket only (secure)
    upgrade: false,                    // Don't try to upgrade to other transports
    forceNew: false,                   // Reuse existing connection
    reconnection: true
  });

  // Connection successful
  socket.on("connect", () => {
    reconnectAttempts = 0; // Reset counter on successful connection
    authDebug.socket("CONNECTED", { socketId: socket.id, url: SOCKET_URL });
    console.log(`[SOCKET CONNECTED] ✓ Server: ${SOCKET_URL}, Socket ID: ${socket.id}`);
  });

  // Reconnection attempt
  socket.on("reconnect_attempt", (attempt) => {
    reconnectAttempts = attempt;
    console.log(`[SOCKET RECONNECTING] Attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}...`);
  });

  // Reconnected after disconnection
  socket.on("reconnect", () => {
    console.log("[SOCKET RECONNECTED] ✓ Connection restored");
    authDebug.socket("RECONNECTED", { socketId: socket.id });
  });

  // Disconnected
  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET DISCONNECTED] Reason: ${reason}`);
    authDebug.socket("DISCONNECTED", { reason, attempts: reconnectAttempts });
  });

  // Connection error (auth failures, network issues)
  socket.on("connect_error", (error) => {
    const errorMessage = error?.message || String(error);
    console.error(`[SOCKET ERROR] ${errorMessage}`);
    authDebug.socket("ERROR", {
      message: errorMessage,
      error: error?.data?.message || errorMessage,
      attempt: reconnectAttempts
    });

    // Handle specific auth errors
    if (errorMessage.includes("Token expired")) {
      console.error("[SOCKET AUTH FAILURE] ❌ Token expired - please login again");
      // Dispatch logout event for frontend to handle
      window.dispatchEvent(new CustomEvent("auth:logout", {
        detail: { reason: "socket_token_expired" }
      }));
    } else if (errorMessage.includes("Invalid token")) {
      console.error("[SOCKET AUTH FAILURE] ❌ Invalid token - please login again");
      window.dispatchEvent(new CustomEvent("auth:logout", {
        detail: { reason: "socket_invalid_token" }
      }));
    } else if (errorMessage.includes("Authentication token required")) {
      console.error("[SOCKET AUTH FAILURE] ❌ No token provided - please login");
      window.dispatchEvent(new CustomEvent("auth:logout", {
        detail: { reason: "socket_no_token" }
      }));
    } else if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
      console.error("[SOCKET ERROR] ❌ Cannot reach server - backend may be down");
    }

    // After max attempts, trigger logout
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && socket?.disconnected) {
      console.error("[SOCKET ERROR] Max reconnection attempts reached - logging out");
      window.dispatchEvent(new CustomEvent("auth:logout", {
        detail: { reason: "socket_max_retries" }
      }));
    }
  });

  // Handle socket errors (after connection established)
  socket.on("error", (error) => {
    console.error("[SOCKET RUNTIME ERROR]", error);
    authDebug.socket("RUNTIME_ERROR", { error });
  });

  return socket;
};

/**
 * Get Socket.IO instance (returns null if not connected)
 */
export const getSocket = () => {
  if (!socket?.connected) {
    return null;
  }
  return socket;
};

/**
 * Disconnect Socket.IO and reset (e.g., on logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
    console.log("[SOCKET DISCONNECTED] ✓ Socket closed and reset");
    authDebug.socket("MANUALLY_DISCONNECTED", {});
  }
};

/**
 * Reconnect Socket.IO with new token (e.g., after token refresh)
 * Closes existing connection and initiates new one
 */
export const reconnectSocket = (newAccessToken) => {
  console.log("[SOCKET RECONNECT] Initiating reconnection with new token...");
  authDebug.socket("RECONNECT_WITH_NEW_TOKEN", { tokenLength: newAccessToken?.length });

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // initSocket() will pick up the new token from getAccessToken()
  return initSocket();
};

/**
 * Listen for auth events and handle socket reconnection
 * SECURITY: Called at module load time to set up global listeners
 */
if (typeof window !== "undefined") {
  // Reconnect socket with new token after successful refresh
  window.addEventListener("auth:token-refreshed", (event) => {
    const newAccessToken = event.detail?.accessToken;
    if (newAccessToken) {
      console.log("[SOCKET EVENT] Token refreshed - reconnecting...");
      authDebug.socket("EVENT_TOKEN_REFRESHED", { tokenLength: newAccessToken.length });
      reconnectSocket(newAccessToken);
    }
  });

  // Disconnect socket on logout
  window.addEventListener("auth:logout", (event) => {
    const reason = event.detail?.reason || "unknown";
    console.log(`[SOCKET EVENT] Logout event - reason: ${reason}`);
    authDebug.socket("EVENT_LOGOUT", { reason });
    disconnectSocket();
  });

  // Debug helper function
  window.socketDebug = {
    isConnected: () => socket?.connected || false,
    getSocketId: () => socket?.id || null,
    getReconnectAttempts: () => reconnectAttempts,
    forceDisconnect: () => disconnectSocket(),
    forceReconnect: () => initSocket(),
    getSocket: () => socket
  };
}

export default getSocket;
