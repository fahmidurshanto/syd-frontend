import Link from "next/link";
import { SITE } from "@/lib/site";

const COLS = [
  { title: "Company", links: [["About", "/about"], ["Safety", "/safety"], ["Careers", "/careers"], ["Contact", "/contact"]] },
  { title: "Services", links: [["Taxi", "/book/taxi"], ["Airport Transfer", "/book/airport"], ["Chauffeur", "/book/chauffeur"], ["Corporate", "/#corporate"], ["Tours", "/tours"], ["Events", "/events"]] },
  { title: "Locations", links: [["Sydney CBD", "/locations/sydney"], ["Sydney Airport (SYD)", "/book/airport"], ["Parramatta", "/locations/parramatta"], ["Northern Beaches", "/locations/northern-beaches"]] },
  { title: "Partners", links: [["Hotels", "/partners/hotels"], ["Travel Agents", "/partners/travel-agents"], ["Corporate", "/partners/corporate"], ["Become a Driver", "/drivers/become-a-driver"]] },
  { title: "Support", links: [["FAQ", "/help/faq"], ["Cancellation", "/cancellation"], ["Refund", "/refund"], ["Lost & Found", "/lost-and-found"]] },
  { title: "Legal", links: [["Terms", "/legal/terms"], ["Privacy", "/legal/privacy"], ["Driver Terms", "/legal/driver-terms"], ["Cookies", "/legal/cookies"]] },
];

export function Footer() {
  return (
    <footer className="relative mt-16 border-t border-white/10 bg-[#080a10]">
      <div className="w-[min(1240px,100%-2.5rem)] mx-auto grid gap-10 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)] lg:grid-cols-[1.6fr_repeat(6,1fr)]">
        <div>
          <p className="font-display font-semibold text-xl tracking-tight text-white">{SITE.name}<span className="text-amber-400">.</span></p>
          <p className="text-zinc-400 mt-3 max-w-xs text-sm leading-relaxed">Premier on-demand taxi, luxury limousine and corporate vehicle services across Greater Sydney. Available 24/7.</p>
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="mt-5 inline-block text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors">{SITE.phone}</a>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 mb-4">{c.title}</p>
            <ul className="space-y-2.5 text-sm">
              {c.links.map(([l, h]) => (
                <li key={l}><Link href={h} className="text-zinc-400 transition-colors hover:text-white">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="w-[min(1240px,100%-2.5rem)] mx-auto text-zinc-500 flex flex-col justify-between gap-2 py-6 text-xs sm:flex-row">
        <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved. Prices in AUD, GST inclusive.</p>
        <p>Made in Sydney, NSW</p>
      </div>
    </footer>
  );
}
