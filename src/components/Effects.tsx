"use client";

import { useEffect } from "react";

/** Adds scroll-reveal to .reveal elements and cursor spotlight to .card-hover. */
export function Effects() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { rootMargin: "0px 0px -8% 0px" },
    );
    const scan = () => document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    const move = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".card-hover");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("pointermove", move);
    };
  }, []);
  return null;
}
