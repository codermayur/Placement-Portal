import { io } from "socket.io-client";

let socket = null;

export const initSocket = () => {
  if (socket) {
    return socket;
  }

// Socket URL must point to backend server, not frontend origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("[SOCKET] Connected to server:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("[SOCKET] Disconnected from server");
  });

  socket.on("connect_error", (error) => {
    console.error("[SOCKET] Connection failed - URL:", SOCKET_URL, error.msg || error);
    console.error("[SOCKET] Check: Backend running on port 5000? User logged in?");
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export default getSocket;
