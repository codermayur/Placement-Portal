import { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem("placement_auth");
      const parsed = saved ? JSON.parse(saved) : { token: "", user: null };
      setAuthToken(parsed?.token || "");
      return parsed;
    } catch {
      setAuthToken("");
      localStorage.removeItem("placement_auth");
      return { token: "", user: null };
    }
  });

  const login = (token, user) => {
    const next = { token, user };
    setAuthToken(token);
    setAuth(next);
    localStorage.setItem("placement_auth", JSON.stringify(next));
  };

  const logout = () => {
    setAuthToken("");
    setAuth({ token: "", user: null });
    localStorage.removeItem("placement_auth");
  };

  useEffect(() => setAuthToken(auth.token), [auth.token]);

  return <AuthContext.Provider value={{ ...auth, login, logout }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
