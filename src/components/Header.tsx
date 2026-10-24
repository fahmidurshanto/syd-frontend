"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/book/taxi", label: "Taxi" },
  { href: "/book/chauffeur", label: "Limousine" },
  { href: "/track", label: "Track Ride" },
];

type ActiveRole = "none" | "passenger" | "driver" | "admin";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<ActiveRole>("none");

  const detectRole = useCallback((): ActiveRole => {
    if (typeof window === "undefined") return "none";
    const hasPassenger = !!localStorage.getItem("syd_passenger_token");
    const hasDriver = !!localStorage.getItem("driver_token");
    const hasAdmin = !!localStorage.getItem("syd_admin_user");
    // Priority: admin > driver > passenger (if somehow multiple are set)
    if (hasAdmin) return "admin";
    if (hasDriver) return "driver";
    if (hasPassenger) return "passenger";
    return "none";
  }, []);

  useEffect(() => {
    setActiveRole(detectRole());

    // Listen for storage changes (e.g., login/logout in another tab)
    const onStorage = () => setActiveRole(detectRole());
    window.addEventListener("storage", onStorage);

    // Also poll on focus to catch same-tab login/logout
    const onFocus = () => setActiveRole(detectRole());
    window.addEventListener("focus", onFocus);

    // Poll periodically to catch same-tab changes (login/logout don't fire storage events in same tab)
    const interval = setInterval(() => setActiveRole(detectRole()), 2000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [detectRole]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Determine which portal links to show
  const showPassenger = activeRole === "none" || activeRole === "passenger";
  const showDriver = activeRole === "none" || activeRole === "driver";
  const showAdmin = activeRole === "none" || activeRole === "admin";

  // Build mobile nav items dynamically
  const mobileNavItems = [
    ...NAV,
    ...(showPassenger ? [{ href: "/passenger/dashboard", label: "My Trips" }] : []),
    ...(showDriver ? [{ href: "/driver/dashboard", label: "Driver Portal" }] : []),
    ...(showAdmin ? [{ href: "/admin/login", label: "Admin Portal" }] : []),
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[72px] transition-all duration-300 border-b ${
        open
          ? "bg-[#07090e] border-white/10 shadow-2xl"
          : scrolled
          ? "bg-[#07090e]/85 backdrop-blur-xl border-white/10"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="w-[min(1240px,100%-2.5rem)] mx-auto flex h-full items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`} id="logo-link">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#05070c" strokeWidth="2.2" strokeLinecap="round"><path d="M3 17c3-6 6-9 9-9s6 3 9 9M7 17c1.5-3 3-4.5 5-4.5s3.5 1.5 5 4.5" /></svg>
          </span>
          <span className="font-display font-semibold text-lg tracking-tight text-white">
            {SITE.short}<span className="text-amber-400">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="relative text-sm font-medium text-zinc-400 hover:text-white py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-amber-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {showPassenger && (
            <Link
              href="/passenger/dashboard"
              className="hidden md:inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-md transition-all active:scale-95"
              id="header-passenger-portal"
            >
              My Trips
            </Link>
          )}
          {showDriver && (
            <Link
              href="/driver/dashboard"
              className="hidden xl:inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-amber-300 border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 backdrop-blur-md transition-all active:scale-95"
              id="header-driver-portal"
            >
              Driver Portal
            </Link>
          )}
          {showAdmin && (
            <Link
              href="/admin/login"
              className="hidden 2xl:inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-amber-400/10 hover:border-amber-400/40 hover:text-white backdrop-blur-md transition-all active:scale-95"
              id="header-login"
            >
              Admin
            </Link>
          )}
          <Link
            href="/book/taxi"
            className="inline-flex items-center justify-center h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-bold text-black !text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.5)] transition-all active:scale-95 whitespace-nowrap"
            id="header-book-now"
          >
            Book now
          </Link>
          <button
            className={`lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200 active:scale-95 ${
              open
                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                : "bg-white/5 text-white border border-white/15 hover:bg-white/10"
            }`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menu"
            id="mobile-menu-toggle"
          >
            {open ? <Icon.close width={22} height={22} /> : <Icon.menu width={22} height={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-x-0 bottom-0 top-[72px] lg:hidden z-[100] overflow-y-auto"
          style={{ backgroundColor: "#07090e" }}
        >
          {/* Subtle amber gradient overlay */}
          <div className="min-h-full bg-gradient-to-b from-[#0e121d] via-[#07090e] to-[#040508] border-t border-amber-400/20">
            <div className="w-[min(1240px,100%-2.5rem)] mx-auto py-8 flex flex-col justify-between min-h-[calc(100svh-72px)]">
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {mobileNavItems.map((n, i) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="font-display flex items-center justify-between border-b border-white/5 py-4 text-xl sm:text-2xl font-semibold text-white hover:text-amber-400 hover:border-amber-400/30 transition-all duration-200"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span>{n.label}</span>
                    <div className="h-8 w-8 rounded-full bg-amber-400/10 grid place-items-center text-amber-400">
                      <Icon.arrow width={16} height={16} />
                    </div>
                  </Link>
                ))}
              </nav>

              {/* Quick Mobile Action Bar */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
                <Link
                  href="/book/taxi"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center h-12 rounded-full font-bold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-[0_4px_25px_-5px_rgba(251,191,36,0.4)] transition active:scale-95"
                >
                  Book Instant Ride
                </Link>
                <p className="text-center text-xs text-zinc-500 mt-2">
                  24/7 Sydney Airport Transfer &amp; Chauffeur Services
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
