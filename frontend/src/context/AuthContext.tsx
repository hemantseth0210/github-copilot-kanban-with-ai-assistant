"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { isAuthenticated, setAuthToken, clearAuthToken, validateCredentials } from "@/lib/auth";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount (client-side only)
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (validateCredentials(username, password)) {
      const token = btoa(`${username}:${password}`);
      setAuthToken(token);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearAuthToken();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
