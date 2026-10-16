"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/book/taxi", label: "Taxi" },
  { href: "/book/chauffeur", label: "Chauffeur" },
  { href: "/#corporate", label: "Corporate" },
  { href: "/fleet", label: "Fleet" },
  { href: "/#locations", label: "Locations" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[72px] transition-all duration-300 border-b ${
        scrolled || open
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
          <Link
            href="/admin/login"
            className="hidden sm:inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-amber-400/10 hover:border-amber-400/40 hover:text-white backdrop-blur-md transition-all active:scale-95"
            id="header-login"
          >
            Admin Portal
          </Link>
          <Link
            href="/book/taxi"
            className="inline-flex items-center justify-center h-[38px] px-4 rounded-full text-xs font-semibold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.5)] transition-all active:scale-95"
            id="header-book-now"
          >
            Book now
          </Link>
          <button
            className="lg:hidden inline-flex items-center justify-center h-[38px] w-[38px] rounded-full text-white/90 border border-white/15 bg-white/[0.03] hover:bg-white/10 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menu"
            id="mobile-menu-toggle"
          >
            {open ? <Icon.close /> : <Icon.menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[72px] lg:hidden bg-[#07090e] border-t border-white/10 z-50">
          <nav className="w-[min(1240px,100%-2.5rem)] mx-auto flex flex-col gap-1 py-6" aria-label="Mobile">
            {[...NAV, { href: "/login", label: "Log in" }].map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="font-display flex items-center justify-between border-b border-white/10 py-4 text-2xl font-semibold text-white hover:text-amber-400 transition-colors"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {n.label}
                <Icon.arrow className="text-amber-400" />
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
