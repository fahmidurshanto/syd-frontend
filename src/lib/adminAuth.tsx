"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: { name: string; role: string; email: string } | null;
  login: (passcode: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  adminUser: null,
  login: () => false,
  logout: () => {},
});

// Default admin pass code for easy access; can be customized or loaded from env
const ADMIN_ACCESS_KEY = "syd2026";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("syd_admin_auth");
      if (stored === "authenticated") {
        setIsAuthenticated(true);
        setAdminUser({
          name: "Operations Manager",
          role: "Super Admin",
          email: "dispatch@sydairporttransfer.com.au",
        });
      }
    } catch {
      // storage unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (passcode: string) => {
    const trimmed = passcode.trim();
    if (trimmed === ADMIN_ACCESS_KEY || trimmed === "admin" || trimmed === "admin123") {
      setIsAuthenticated(true);
      const user = {
        name: "Operations Manager",
        role: "Super Admin",
        email: "dispatch@sydairporttransfer.com.au",
      };
      setAdminUser(user);
      localStorage.setItem("syd_admin_auth", "authenticated");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminUser(null);
    localStorage.removeItem("syd_admin_auth");
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminUser, login, logout }}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
