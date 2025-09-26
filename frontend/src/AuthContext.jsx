import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // user info from backend
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/me", { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
  const res = await axios.post("/api/login", { email, password }, { withCredentials: true });
  setUser(res.data.user);
  return res.data.user; //  return user so Login page can use it
    };


  const logout = async () => {
    await axios.post("/api/logout", {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
