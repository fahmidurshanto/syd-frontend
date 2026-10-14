"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuth";
import { SITE } from "@/lib/site";

interface AdminNavbarProps {
  onOpenMobileSidebar?: () => void;
}

export function AdminNavbar({ onOpenMobileSidebar }: AdminNavbarProps) {
  const pathname = usePathname();
  const { adminUser, logout } = useAdminAuth();

  const getPageTitle = () => {
    if (pathname.includes("/admin/bookings")) return "Bookings & Dispatch";
    if (pathname.includes("/admin/places")) return "Routes & Fixed Tariffs";
    if (pathname.includes("/admin/vehicles")) return "Fleet Vehicles & Capacities";
    return "Operations Dashboard";
  };

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-[#090d15]/90 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Mobile hamburger & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs font-semibold uppercase tracking-wider hidden sm:inline">
            Admin Console
          </span>
          <span className="text-white/30 hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-white tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Quick actions, Live Status & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SYD Live API</span>
        </div>

        {/* Quick View Public Site */}
        <Link
          href="/"
          target="_blank"
          className="text-xs text-white/60 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition flex items-center gap-1.5"
          title="Open customer website in new tab"
        >
          <span className="hidden sm:inline">Client Site</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </Link>

        {/* Dispatcher Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-gold text-xs font-bold">
            {adminUser?.name?.[0] || "A"}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-white">{adminUser?.name || "Admin"}</div>
            <div className="text-[10px] text-white/40">{adminUser?.role || "Staff"}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Sign out of Admin"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
