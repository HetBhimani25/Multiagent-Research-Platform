"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify stored token on load
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      fetchUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setUser(data.user);
          setToken(authToken);
          return;
        }
      }

      // If token invalid or user removed from DB, reset entire session cleanly
      localStorage.removeItem("auth_token");
      localStorage.removeItem("researchflow_saved_papers");
      localStorage.removeItem("rf_theme");
      setUser(null);
      setToken(null);
    } catch (err) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("researchflow_saved_papers");
      localStorage.removeItem("rf_theme");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);

      if (!res) {
        return { success: false, error: "Node Gateway server is offline (port 4000)." };
      }

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (err: any) {
      return { success: false, error: "Network error: " + err.message };
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      }).catch(() => null);

      if (!res) {
        return { success: false, error: "Node Gateway server is offline (port 4000)." };
      }

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (err: any) {
      return { success: false, error: "Network error: " + err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("researchflow_saved_papers");
    localStorage.removeItem("rf_theme");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
