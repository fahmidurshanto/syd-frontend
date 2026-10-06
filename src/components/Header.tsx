"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/book/taxi", label: "Taxi" },
  { href: "/book/airport", label: "Airport" },
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
    <header className="site-header" data-scrolled={scrolled || open}>
      <div className="container flex h-full items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`} id="logo-link">
          <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg, var(--gold-300), var(--gold-600))" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-950)" strokeWidth="2.2" strokeLinecap="round"><path d="M3 17c3-6 6-9 9-9s6 3 9 9M7 17c1.5-3 3-4.5 5-4.5s3.5 1.5 5 4.5" /></svg>
          </span>
          <span className="display text-lg tracking-tight">
            {SITE.short}<span style={{ color: "var(--gold-400)" }}>.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link">{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex" id="header-login">Log in</Link>
          <Link href="/book/taxi" className="btn btn-gold btn-sm" id="header-book-now">Book now</Link>
          <button className="btn btn-ghost btn-sm lg:hidden" style={{ width: 38, padding: 0 }} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu" id="mobile-menu-toggle">
            {open ? <Icon.close /> : <Icon.menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 lg:hidden" style={{ top: "var(--header-h)", background: "var(--ink-950)" }}>
          <nav className="container flex flex-col gap-1 py-6" aria-label="Mobile">
            {[...NAV, { href: "/login", label: "Log in" }].map((n, i) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="display fade-up flex items-center justify-between border-b py-4 text-2xl" style={{ borderColor: "var(--line)", animationDelay: `${i * 40}ms` }}>
                {n.label}
                <Icon.arrow style={{ color: "var(--gold-400)" }} />
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
