import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD USER ON REFRESH ---------------- */
  useEffect(() => {
    if (token) {
      // token exists → user is authenticated
      setUser({ loggedIn: true });
    }
    setLoading(false);
  }, [token]);

  /* ---------------- LOGIN ---------------- */
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);

      navigate("/dashboard");
    } catch (error) {
      throw new Error("Invalid credentials");
    }
  };

  /* ---------------- REGISTER ---------------- */
  const register = async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      throw new Error(message);
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    navigate("/");
  };

  /* ---------------- CONTEXT VALUE ---------------- */
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
