import Image from "next/image";
import Link from "next/link";
import { HeroBookingForm } from "@/components/HeroBookingForm";
import { Icon } from "@/components/Icon";
import { SITE } from "@/lib/site";

const QUICK_ACTIONS = [
  { id: "taxi", title: "Taxi Now", desc: "Everyday affordable rides on demand", href: "/book/taxi", icon: "car" as const, badge: "On Demand" },
  { id: "airport", title: "Airport Transfer", desc: "Pre-booked transfers with flight tracking", href: "/book/airport", icon: "plane" as const, badge: "Pre-book" },
  { id: "chauffeur", title: "Chauffeur", desc: "Executive, luxury & VIP hourly hire", href: "/book/chauffeur", icon: "crown" as const, badge: "Premium" },
  { id: "corporate", title: "Corporate", desc: "Centralized account & monthly invoicing", href: "/#corporate", icon: "briefcase" as const, badge: "B2B" },
];

const RIDE_TYPES = [
  { slug: "taxi", title: "Taxi", desc: "Affordable everyday rides across Sydney", pax: "1-4", luggage: "2", image: "/fleet/taxi.png", href: "/book/taxi" },
  { slug: "airport", title: "Airport Transfer", desc: "Pre-booked pickup with flight tracking & meet and greet", pax: "1-14", luggage: "14", image: "/fleet/luxury.png", href: "/book/airport" },
  { slug: "executive", title: "Executive", desc: "Business transportation in premium sedans", pax: "1-4", luggage: "3", image: "/fleet/sedan.png", href: "/book/chauffeur" },
  { slug: "luxury", title: "Luxury Chauffeur", desc: "First-class travel in luxury vehicles", pax: "1-3", luggage: "3", image: "/fleet/luxury.png", href: "/book/chauffeur" },
  { slug: "group", title: "Group Transfer", desc: "People movers & vans for families or teams", pax: "1-14", luggage: "14", image: "/fleet/suv.png", href: "/book/chauffeur" },
  { slug: "intercity", title: "Intercity", desc: "City-to-regional travel (Newcastle, Wollongong, etc.)", pax: "1-14", luggage: "14", image: "/fleet/van.png", href: "/book/chauffeur" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter trip details", desc: "Specify pickup, destination, time and number of passengers." },
  { step: "02", title: "Select vehicle", desc: "Choose from Taxi, Executive, SUV, MPV or Minibus options." },
  { step: "03", title: "See fixed fare", desc: "Transparent GST-inclusive quote locked in before booking." },
  { step: "04", title: "Book & pay", desc: "Securely confirm your booking with instant confirmation." },
  { step: "05", title: "Track driver", desc: "Get real-time live map tracking & driver arrival updates." },
  { step: "06", title: "Enjoy ride", desc: "Professional chauffeur service, relaxed and punctual." },
];

const FLEET_PREVIEW = [
  { category: "Taxi", pax: "1-4", luggage: 2, image: "/fleet/taxi.png", desc: "Toyota Camry Hybrid or equivalent", href: "/fleet" },
  { category: "Sedan", pax: "1-4", luggage: 3, image: "/fleet/sedan.png", desc: "Mercedes-Benz E-Class, BMW 5 Series", href: "/fleet" },
  { category: "Luxury Sedan", pax: "1-3", luggage: 3, image: "/fleet/luxury.png", desc: "Mercedes-Benz S-Class, BMW 7 Series", href: "/fleet" },
  { category: "SUV", pax: "1-6", luggage: 5, image: "/fleet/suv.png", desc: "Audi Q7, Mercedes GLE", href: "/fleet" },
  { category: "MPV", pax: "1-7", luggage: 6, image: "/fleet/mpv.png", desc: "Mercedes V-Class, Kia Carnival", href: "/fleet" },
  { category: "Van / Minibus", pax: "8-14", luggage: 14, image: "/fleet/van.png", desc: "Mercedes Sprinter Executive", href: "/fleet" },
];

export default function HomePage() {
  return (
    <>
      {/* HP-1: Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <Image src="/hero.png" alt="Sydney Chauffeur Transfer" fill priority sizes="100vw" quality={90} />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <span className="eyebrow fade-up" style={{ animationDelay: "100ms" }}>Greater Sydney & Regional NSW</span>
            <h1 className="display fade-up text-white" style={{ animationDelay: "180ms" }}>
              MOVE WITH <span className="text-gold">CONFIDENCE</span>.
            </h1>
            <p className="dim fade-up mb-8 text-lg sm:text-xl" style={{ animationDelay: "220ms" }}>
              Premium taxi, Sydney airport transfer, luxury chauffeur & corporate mobility. Fixed rates, verified drivers, 24/7 reliability.
            </p>
          </div>
          <HeroBookingForm />
        </div>
      </section>

      {/* HP-2: Quick Action Cards */}
      <section className="section bg-[var(--ink-900)]">
        <div className="container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((qa) => {
              const I = Icon[qa.icon];
              return (
                <Link key={qa.id} href={qa.href} className="card card-hover reveal p-6" id={`quick-action-${qa.id}`}>
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: "hsl(40 62% 64% / 0.1)", color: "var(--gold-400)" }}>
                      <I width={24} height={24} />
                    </span>
                    <span className="pill pill-gold">{qa.badge}</span>
                  </div>
                  <h3 className="display mt-6 text-xl">{qa.title}</h3>
                  <p className="mute mt-2 text-sm">{qa.desc}</p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--gold-300)" }}>
                    Book now <Icon.arrow width={16} height={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* HP-3: Choose Your Ride */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Services</span>
            <h2 className="display">CHOOSE YOUR RIDE</h2>
            <p className="dim">Tailored mobility options engineered for every Sydney travel requirement.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RIDE_TYPES.map((rt) => (
              <Link key={rt.slug} href={rt.href} className="card card-hover reveal flex flex-col justify-between p-6">
                <div>
                  <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl bg-[var(--ink-800)]">
                    <Image src={rt.image} alt={rt.title} fill className="object-cover" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="display text-xl">{rt.title}</h3>
                    <span className="pill">{rt.pax} pax</span>
                  </div>
                  <p className="mute mt-2 text-sm">{rt.desc}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs font-semibold">
                  <span className="dim">Luggage capacity: {rt.luggage} bags</span>
                  <span className="flex items-center gap-1" style={{ color: "var(--gold-300)" }}>
                    Details <Icon.arrow width={14} height={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HP-4: How It Works */}
      <section className="section bg-[var(--ink-900)]">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Simplicity</span>
            <h2 className="display">HOW IT WORKS</h2>
            <p className="dim">Fast on-demand taxi requests or pre-planned chauffeur bookings in 6 simple steps.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS.map((hw) => (
              <div key={hw.step} className="card reveal p-6">
                <span className="step-num">{hw.step}</span>
                <h3 className="display mt-4 text-xl">{hw.title}</h3>
                <p className="mute mt-2 text-sm">{hw.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HP-5: Fleet Preview */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Fleet</span>
            <h2 className="display">OUR LUXURY FLEET</h2>
            <p className="dim">Meticulously maintained, late-model vehicles driven by professional chauffeurs.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FLEET_PREVIEW.map((fl) => (
              <div key={fl.category} className="card card-hover reveal p-6">
                <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl bg-[var(--ink-850)]">
                  <Image src={fl.image} alt={fl.category} fill className="object-cover" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="display text-xl">{fl.category}</h3>
                  <div className="flex gap-2">
                    <span className="pill">{fl.pax} pax</span>
                  </div>
                </div>
                <p className="mute mt-2 text-sm">{fl.desc}</p>
                <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
                  <span className="text-xs text-[var(--text-mute)]">{fl.luggage} Luggage Capacity</span>
                  <Link href={fl.href} className="btn btn-ghost btn-sm">View details</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HP-6: Trust & Extras */}
      <section className="section bg-[var(--ink-900)]" id="corporate">
        <div className="container">
          <div className="glass reveal grid gap-8 p-8 md:grid-cols-2 lg:items-center">
            <div>
              <span className="eyebrow">Enterprise</span>
              <h2 className="display mt-2 text-3xl sm:text-4xl">CORPORATE & BUSINESS TRAVEL</h2>
              <p className="dim mt-4">
                Streamline mobility for your executives, clients and guests. One portal, multiple users, flexible credit limits and automated monthly invoicing.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-3"><Icon.check style={{ color: "var(--gold-400)" }} /> Dedicated Account Manager & 24/7 Priority Support</li>
                <li className="flex items-center gap-3"><Icon.check style={{ color: "var(--gold-400)" }} /> Consolidated Monthly Statements & Tax Invoices</li>
                <li className="flex items-center gap-3"><Icon.check style={{ color: "var(--gold-400)" }} /> Customized Booking Policies & Employee Access Control</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/book/chauffeur" className="btn btn-gold">Open Corporate Account</Link>
                <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="btn btn-ghost">Contact Corporate Team</a>
              </div>
            </div>
            <div className="relative h-72 overflow-hidden rounded-2xl md:h-full">
              <Image src="/hero.png" alt="Corporate Transfer" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-950)] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
