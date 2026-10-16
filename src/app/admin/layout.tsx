"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/adminAuth";
import { AdminNavbar } from "@/components/AdminNavbar";
import { SITE } from "@/lib/site";

const ADMIN_NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    href: "/admin/routes",
    label: "Routes & Pricing",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    ),
  },
  {
    href: "/admin/vehicles",
    label: "Fleet Vehicles",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    ),
  },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, adminUser, loading, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // If not authenticated, not currently loading, and not on login page, redirect to login
    if (!loading && !isAuthenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span className="text-xs text-white/50 tracking-wider uppercase font-medium">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#06080d] text-white">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-white/10 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "hsl(224 30% 7%)" }}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="h-18 flex items-center px-6 gap-3 border-b border-white/10">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl shadow-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#05070c" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 17c3-6 6-9 9-9s6 3 9 9M7 17c1.5-3 3-4.5 5-4.5s3.5 1.5 5 4.5" />
              </svg>
            </span>
            <div>
              <div className="font-display text-base font-semibold tracking-tight text-white">
                {SITE.short} <span className="text-amber-400 font-normal text-xs uppercase px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">Admin</span>
              </div>
              <div className="text-[11px] text-white/40">Sydney Dispatch Hub</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {ADMIN_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    active
                      ? "bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className={active ? "text-amber-400" : "text-white/50"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Dispatcher Info and Quick Link */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xs font-bold uppercase">
              {adminUser?.name ? adminUser.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold truncate text-white flex items-center gap-1.5">
                <span className="truncate">{adminUser?.name || "Administrator"}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 uppercase font-mono">
                  {adminUser?.role || "Staff"}
                </span>
              </div>
              <div className="text-[10px] text-white/40 truncate">{adminUser?.email || "admin@sydtransport.com.au"}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 text-center py-1.5 text-xs text-white/60 hover:text-white bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition"
            >
              Public Site ↗
            </Link>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition"
              title="Sign Out"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Dedicated Admin Navbar */}
        <AdminNavbar onOpenMobileSidebar={() => setSidebarOpen(true)} />

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}
