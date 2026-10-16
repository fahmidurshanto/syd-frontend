"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main id="main">{children}</main>;
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] inline-flex items-center justify-center h-[38px] px-4 rounded-full text-xs font-semibold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-md"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
