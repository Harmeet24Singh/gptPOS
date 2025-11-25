"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse currentUser from localStorage", e);
    }
  }, []);

  const login = (username, password) => {
    // Try server first with proper username/password validation
    return (async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const list = await res.json();
          const found = list.find((u) => {
            const userMatch = (u.username || u.id || '').toLowerCase() === username.toLowerCase();
            const passMatch = (u.password || u.pwd || '') === password;
            return userMatch && passMatch;
          });
          if (found) {
            localStorage.setItem("currentUser", JSON.stringify(found));
            setUser(found);
            return true;
          }
        }
      } catch (e) {
        // ignore and fallback
      }

      // Fallback to localStorage users (legacy)
      const saved = JSON.parse(localStorage.getItem("users") || "[]");
      const found = saved.find((u) => {
        const userMatch = (u.username || u.id || '').toLowerCase() === username.toLowerCase();
        const passMatch = (u.password || u.pwd || '') === password;
        return userMatch && passMatch;
      });
      if (found) {
        localStorage.setItem("currentUser", JSON.stringify(found));
        setUser(found);
        return true;
      }
      return false;
    })();
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
