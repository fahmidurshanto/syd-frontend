"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { SITE } from "@/lib/site";
import {
  getPassengerToken,
  getPassengerInfo,
  setPassengerInfo,
  clearPassengerToken,
  clearPassengerInfo,
  getPassengerMeApi,
  passengerLogoutApi,
  getDriverToken,
  getDriverInfo,
  setDriverInfo,
  clearDriverToken,
  clearDriverInfo,
  getDriverMeApi,
  driverLogoutApi,
  getAdminInfo,
  setAdminInfo,
  clearAdminInfo,
  getAdminMeApi,
  adminLogoutApi,
} from "@/lib/api";

const NAV = [
  { href: "/book/taxi", label: "Taxi" },
  { href: "/book/chauffeur", label: "Limousine" },
  { href: "/track", label: "Track Ride" },
];

type ActiveRole = "none" | "passenger" | "driver" | "admin";

interface AuthState {
  role: ActiveRole;
  name: string;
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ role: "none", name: "" });

  const detectAuth = useCallback((): AuthState => {
    if (typeof window === "undefined") return { role: "none", name: "" };

    // 1. Check Driver (from cookie)
    try {
      const driverToken = getDriverToken();
      if (driverToken) {
        const driver = getDriverInfo();
        return {
          role: "driver",
          name: driver?.name || driver?.fullName || "Driver",
        };
      }
    } catch {}

    // 2. Check Passenger (from cookie)
    try {
      const passengerToken = getPassengerToken();
      if (passengerToken) {
        const passenger = getPassengerInfo();
        return {
          role: "passenger",
          name: passenger?.name || passenger?.email?.split("@")[0] || "Passenger",
        };
      }
    } catch {}

    // 3. Check Admin (from cookie)
    try {
      const admin = getAdminInfo();
      if (admin && (admin.name || admin.email)) {
        return {
          role: "admin",
          name: admin.name || admin.email.split("@")[0] || "Admin",
        };
      }
    } catch {}

    return { role: "none", name: "" };
  }, []);

  useEffect(() => {
    const current = detectAuth();

    // If passenger is logged in but passenger_info cookie name not yet retrieved, fetch /passengers/me
    if (current.role === "passenger" && current.name === "Passenger") {
      setProfileLoading(true);
      getPassengerMeApi()
        .then((res) => {
          if (res?.passenger) {
            setPassengerInfo(res.passenger);
            setAuth({
              role: "passenger",
              name: res.passenger.name || res.passenger.email?.split("@")[0] || "Passenger",
            });
          } else {
            setAuth(current);
          }
        })
        .catch(() => {
          passengerLogoutApi();
          setAuth({ role: "none", name: "" });
        })
        .finally(() => {
          setProfileLoading(false);
          setMounted(true);
        });
    } else if (current.role === "driver" && current.name === "Driver") {
      setProfileLoading(true);
      getDriverMeApi()
        .then((d) => {
          if (d) {
            setDriverInfo(d);
            setAuth({
              role: "driver",
              name: d.name || "Driver",
            });
          } else {
            setAuth(current);
          }
        })
        .catch(() => {
          driverLogoutApi();
          setAuth({ role: "none", name: "" });
        })
        .finally(() => {
          setProfileLoading(false);
          setMounted(true);
        });
    } else if (
      current.role === "none" &&
      typeof document !== "undefined" &&
      (document.cookie.includes("refreshToken=") || document.cookie.includes("accessToken=")) &&
      !getDriverToken() &&
      !getPassengerToken()
    ) {
      setProfileLoading(true);
      getAdminMeApi()
        .then((res) => {
          if (res?.admin) {
            setAdminInfo(res.admin);
            setAuth({
              role: "admin",
              name: res.admin.name || res.admin.email?.split("@")[0] || "Admin",
            });
          } else {
            setAuth(current);
          }
        })
        .catch(() => {
          setAuth({ role: "none", name: "" });
        })
        .finally(() => {
          setProfileLoading(false);
          setMounted(true);
        });
    } else {
      setAuth(current);
      setMounted(true);
    }

    const refresh = () => {
      const updated = detectAuth();
      setAuth(updated);
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("syd_auth_change", refresh);
    const interval = setInterval(refresh, 2000);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("syd_auth_change", refresh);
      clearInterval(interval);
    };
  }, [detectAuth]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const handleLogout = async () => {
    if (auth.role === "admin") {
      try {
        await adminLogoutApi();
      } catch {}
      clearAdminInfo();
    } else if (auth.role === "driver") {
      await driverLogoutApi();
    } else if (auth.role === "passenger") {
      await passengerLogoutApi();
    }
    clearDriverToken();
    clearDriverInfo();
    clearPassengerToken();
    clearPassengerInfo();
    clearAdminInfo();
    window.dispatchEvent(new Event("syd_auth_change"));
    setAuth({ role: "none", name: "" });
  };

  // Build mobile nav items dynamically
  const mobileNavItems = [
    ...NAV,
    ...(mounted && !profileLoading
      ? auth.role === "admin"
        ? [{ href: "/admin", label: "Admin Panel" }]
        : auth.role === "passenger"
        ? [{ href: "/passenger/dashboard", label: "Passenger Portal" }]
        : auth.role === "driver"
        ? [{ href: "/driver/dashboard", label: "Driver Portal" }]
        : [
            { href: "/passenger/login", label: "Passenger Portal" },
            { href: "/driver/login", label: "Driver Portal" },
            { href: "/admin/login", label: "Admin Portal" },
          ]
      : []),
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

        <div className="flex items-center gap-2 sm:gap-2.5">
          {mounted && !profileLoading ? (
            <>
              {/* Admin Logged In */}
              {auth.role === "admin" && (
                <>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-xs"
                    id="header-user-badge"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-semibold text-amber-200 max-w-[110px] sm:max-w-[150px] md:max-w-[180px] truncate" title={auth.name}>
                      {auth.name}
                    </span>
                  </div>
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 backdrop-blur-md transition-all active:scale-95 whitespace-nowrap shadow-sm"
                    id="header-admin-panel"
                  >
                    Admin Panel
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                    className="hidden sm:inline-flex items-center justify-center h-[38px] w-[38px] rounded-full text-zinc-400 hover:text-red-400 border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Icon.logout width={16} height={16} />
                  </button>
                </>
              )}

              {/* Passenger Logged In */}
              {auth.role === "passenger" && (
                <>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs"
                    id="header-user-badge"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white max-w-[110px] sm:max-w-[150px] md:max-w-[180px] truncate" title={auth.name}>
                      {auth.name}
                    </span>
                  </div>
                  <Link
                    href="/passenger/dashboard"
                    className="inline-flex items-center justify-center h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold text-zinc-200 border border-white/15 bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-md transition-all active:scale-95 whitespace-nowrap shadow-sm"
                    id="header-passenger-portal"
                  >
                    Passenger Portal
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                    className="hidden sm:inline-flex items-center justify-center h-[38px] w-[38px] rounded-full text-zinc-400 hover:text-red-400 border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Icon.logout width={16} height={16} />
                  </button>
                </>
              )}

              {/* Driver Logged In */}
              {auth.role === "driver" && (
                <>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-xs"
                    id="header-user-badge"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white max-w-[110px] sm:max-w-[150px] md:max-w-[180px] truncate" title={auth.name}>
                      {auth.name}
                    </span>
                  </div>
                  <Link
                    href="/driver/dashboard"
                    className="inline-flex items-center justify-center h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold text-amber-300 border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 backdrop-blur-md transition-all active:scale-95 whitespace-nowrap shadow-sm"
                    id="header-driver-portal"
                  >
                    Driver Portal
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                    className="hidden sm:inline-flex items-center justify-center h-[38px] w-[38px] rounded-full text-zinc-400 hover:text-red-400 border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Icon.logout width={16} height={16} />
                  </button>
                </>
              )}

              {/* Guest (Not Logged In) */}
              {auth.role === "none" && (
                <>
                  <Link
                    href="/passenger/login"
                    className="hidden md:inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-md transition-all active:scale-95"
                    id="header-passenger-login"
                  >
                    Passenger Portal
                  </Link>
                  <Link
                    href="/driver/login"
                    className="hidden xl:inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-amber-300 border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 backdrop-blur-md transition-all active:scale-95"
                    id="header-driver-login"
                  >
                    Driver Portal
                  </Link>
                  <Link
                    href="/admin/login"
                    className="hidden 2xl:inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-amber-400/10 hover:border-amber-400/40 hover:text-white backdrop-blur-md transition-all active:scale-95"
                    id="header-login"
                  >
                    Admin
                  </Link>
                </>
              )}
            </>
          ) : (
            <div className="hidden sm:inline-flex items-center h-[38px] w-20 rounded-full bg-white/5 animate-pulse" />
          )}

          {/* Book Now is always available */}
          <Link
            href="/book"
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
              <div>
                {/* Mobile User Card when logged in */}
                {mounted && !profileLoading && auth.role !== "none" && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 grid place-items-center font-bold text-base">
                        {auth.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{auth.name}</div>
                        <div className="text-[11px] text-amber-400 font-medium capitalize">
                          {auth.role === "admin"
                            ? "Administrator"
                            : auth.role === "driver"
                            ? "Driver Partner"
                            : "Passenger"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="shrink-0 text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 transition"
                    >
                      Sign out
                    </button>
                  </div>
                )}

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
              </div>

              {/* Quick Mobile Action Bar */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
                <Link
                  href="/book"
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
