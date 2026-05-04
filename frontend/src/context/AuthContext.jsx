/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, logoutUser } from "../api/auth";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    name:
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email,
    role: user.isAdmin ? "admin" : "client",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const data = await getCurrentUser();
        setUser(normalizeUser(data.data?.user || data.user));
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  const login = async ({ email, password }) => {
    const data = await loginUser({ email, password });
    const loggedInUser = normalizeUser(data.data?.user || data.user);

    setUser(loggedInUser);

    return loggedInUser;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
