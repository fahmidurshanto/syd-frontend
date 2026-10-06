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
    <footer className="relative mt-10 border-t" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
      <div className="container grid gap-10 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)] lg:grid-cols-[1.6fr_repeat(6,1fr)]">
        <div>
          <p className="display text-xl">{SITE.name}<span style={{ color: "var(--gold-400)" }}>.</span></p>
          <p className="mute mt-3 max-w-xs text-sm">Premium taxi, airport transfers and chauffeur service across Greater Sydney. Available 24/7.</p>
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="mt-5 inline-block text-sm" style={{ color: "var(--gold-300)" }}>{SITE.phone}</a>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="label mb-4">{c.title}</p>
            <ul className="space-y-2.5 text-sm">
              {c.links.map(([l, h]) => (
                <li key={l}><Link href={h} className="dim transition-colors hover:text-white">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="divider" />
      <div className="container mute flex flex-col justify-between gap-2 py-6 text-xs sm:flex-row">
        <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved. Prices in AUD, GST inclusive.</p>
        <p>Made in Sydney, NSW</p>
      </div>
    </footer>
  );
}
