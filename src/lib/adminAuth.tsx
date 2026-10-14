"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminUser, adminLoginApi, adminLogoutApi, getAdminMeApi } from "./api";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  adminUser: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("syd_admin_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.email) return parsed;
      }
    } catch {}
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem("syd_admin_user");
    } catch {
      return false;
    }
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verifies active cookie session with /api/v1/admins/me
  const refreshProfile = useCallback(async () => {
    try {
      const res = await getAdminMeApi();
      if (res && res.success && res.admin) {
        setIsAuthenticated(true);
        setAdminUser(res.admin);
        try {
          localStorage.setItem("syd_admin_user", JSON.stringify(res.admin));
        } catch {}
        return;
      }
    } catch {
      // If cookie session is invalid or expired
      setIsAuthenticated(false);
      setAdminUser(null);
      try {
        localStorage.removeItem("syd_admin_user");
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verify session with backend cookie on mount
    void refreshProfile();
  }, [refreshProfile]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await adminLoginApi(email.trim(), password);
      if (res.success && res.admin) {
        setIsAuthenticated(true);
        setAdminUser(res.admin);
        try {
          localStorage.setItem("syd_admin_user", JSON.stringify(res.admin));
        } catch {}
        return { ok: true };
      }
      return { ok: false, error: res.message || "Failed to authenticate" };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await adminLogoutApi();
    } catch {}
    setIsAuthenticated(false);
    setAdminUser(null);
    try {
      localStorage.removeItem("syd_admin_user");
    } catch {}
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, adminUser, loading, login, logout, refreshProfile }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
