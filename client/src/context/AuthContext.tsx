"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  handleTokensRotated: (tokens: { accessToken: string; refreshToken?: string; user?: User }) => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("researchflow_saved_papers");
    localStorage.removeItem("rf_theme");
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const storedRefreshToken = localStorage.getItem("refresh_token");
    if (!storedRefreshToken) {
      clearSession();
      return null;
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      }).catch(() => null);

      if (!res || !res.ok) {
        clearSession();
        return null;
      }

      const data = await res.json();
      if (data.status === "success" && (data.accessToken || data.token)) {
        const newAccessToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken || storedRefreshToken;

        localStorage.setItem("auth_token", newAccessToken);
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }

        setToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        if (data.user) {
          setUser(data.user);
        }

        return newAccessToken;
      }

      clearSession();
      return null;
    } catch (e) {
      clearSession();
      return null;
    }
  }, [clearSession]);

  const fetchUserProfile = useCallback(async (authToken: string) => {
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
          setRefreshToken(localStorage.getItem("refresh_token"));
          return;
        }
      }

      // If token expired (401), attempt silent token refresh
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        const retryRes = await fetch("http://localhost:4000/api/auth/me", {
          headers: { Authorization: `Bearer ${refreshedToken}` },
        }).catch(() => null);

        if (retryRes && retryRes.ok) {
          const retryData = await retryRes.json();
          if (retryData.status === "success") {
            setUser(retryData.user);
            setToken(refreshedToken);
            return;
          }
        }
      }

      // If refresh also failed, clear session
      clearSession();
    } catch (err) {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession, refreshAccessToken]);

  // Verify stored token on load
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      fetchUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUserProfile]);

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
      if (res.ok && (data.accessToken || data.token)) {
        const accessToken = data.accessToken || data.token;
        const incomingRefreshToken = data.refreshToken;

        localStorage.setItem("auth_token", accessToken);
        if (incomingRefreshToken) {
          localStorage.setItem("refresh_token", incomingRefreshToken);
        }

        setToken(accessToken);
        setRefreshToken(incomingRefreshToken || null);
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
      if (res.ok && (data.accessToken || data.token)) {
        const accessToken = data.accessToken || data.token;
        const incomingRefreshToken = data.refreshToken;

        localStorage.setItem("auth_token", accessToken);
        if (incomingRefreshToken) {
          localStorage.setItem("refresh_token", incomingRefreshToken);
        }

        setToken(accessToken);
        setRefreshToken(incomingRefreshToken || null);
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
    const currentRefreshToken = localStorage.getItem("refresh_token") || refreshToken;
    const currentToken = localStorage.getItem("auth_token") || token;

    // Send best-effort logout notification to server to revoke refresh tokens
    fetch("http://localhost:4000/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    }).catch(() => {});

    clearSession();
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  };

  const handleTokensRotated = (tokens: { accessToken: string; refreshToken?: string; user?: User }) => {
    localStorage.setItem("auth_token", tokens.accessToken);
    setToken(tokens.accessToken);

    if (tokens.refreshToken) {
      localStorage.setItem("refresh_token", tokens.refreshToken);
      setRefreshToken(tokens.refreshToken);
    }

    if (tokens.user) {
      setUser(tokens.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        loading,
        login,
        register,
        logout,
        updateUser,
        handleTokensRotated,
        refreshAccessToken,
      }}
    >
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
