import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../services/api";
import { AuthContext, type User } from "./authTypes";
import {
  initializeSocket,
  disconnectSocket,
  joinRoom,
  joinRoleRoom,
} from "../services/socketService";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const storedUser = JSON.parse(localStorage.getItem("user") || "null");
          if (storedUser) {
            setUser(storedUser);
            // Initialize socket connection
            initializeSocket(token);
            joinRoom(storedUser.id);
            joinRoleRoom(storedUser.role);
          }
        } catch (error) {
          console.error("Failed to parse user from localStorage:", error);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    // Use setTimeout to move setState out of the effect
    setTimeout(initializeAuth, 0);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    // Initialize socket connection after login
    initializeSocket(token);
    joinRoom(user.id);
    joinRoleRoom(user.role);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, api }}>
      {children}
    </AuthContext.Provider>
  );
};
