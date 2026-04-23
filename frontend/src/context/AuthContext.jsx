import { createContext, useContext, useEffect, useState } from "react";
import { setAccessToken, clearAccessToken } from "../utils/apiClient";
import { initSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem("placement_auth");
      const parsed = saved ? JSON.parse(saved) : { token: "", user: null };
      if (parsed?.token) setAccessToken(parsed.token);
      return parsed;
    } catch {
      clearAccessToken();
      localStorage.removeItem("placement_auth");
      return { token: "", user: null };
    }
  });

  const login = (token, user) => {
    const next = { token, user };
    setAccessToken(token);
    setAuth(next);
    localStorage.setItem("placement_auth", JSON.stringify(next));
    // Initialize socket only after successful login with valid token
    initSocket();
  };

  const logout = () => {
    clearAccessToken();
    disconnectSocket();
    setAuth({ token: "", user: null });
    localStorage.removeItem("placement_auth");
  };

  // Sync logout state: clear token when auth.token becomes empty
  useEffect(() => {
    if (!auth.token) {
      clearAccessToken();
    }
  }, [auth.token]);

  // Listen for logout events (e.g., token expired, refresh failed)
  useEffect(() => {
    const handleLogout = (event) => {
      const reason = event.detail?.reason || "unknown";
      console.log(`[AUTH] Logout triggered by event (reason: ${reason})`);
      logout();
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  return <AuthContext.Provider value={{ ...auth, login, logout }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
