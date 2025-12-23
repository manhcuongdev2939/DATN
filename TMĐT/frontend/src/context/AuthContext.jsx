import React, { createContext, useContext, useEffect, useState } from "react";
import {
  authAPI,
  adminAPI,
  getToken,
  getAdminToken,
  removeAdminToken,
} from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        if (getToken()) {
          const res = await authAPI.getMe();
          setUser(res.user || null);
        }

        if (getAdminToken()) {
          const res = await adminAPI.getMe();
          setAdmin(res.admin || null);
        }
      } catch {
        removeAdminToken();
        setAdmin(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    if (res.user) setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const adminLogin = async (email, password) => {
    const res = await adminAPI.login(email, password);
    // Normalize response: backend uses 'user' for admin login, but other endpoints expect 'admin'
    const adminInfo = res?.admin || res?.user || null;

    if (adminInfo) {
      setAdmin(adminInfo);
      return res;
    }

    // If login succeeded but no admin info returned, attempt to fetch it
    try {
      const me = await adminAPI.getMe();
      setAdmin(me.admin || null);
      return res;
    } catch (err) {
      // If fetching admin info fails, clear token and surface error to caller
      removeAdminToken();
      setAdmin(null);
      throw err;
    }
  };

  const adminLogout = async () => {
    await adminAPI.logout();
    removeAdminToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isAuthLoading,
        login,
        logout,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export { AuthContext };
