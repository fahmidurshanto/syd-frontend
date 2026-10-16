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
      <section className="relative z-20 min-h-[100svh] flex items-center pt-[calc(72px+2rem)] pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image src="/hero.png" alt="Sydney Chauffeur Transfer" fill priority sizes="100vw" quality={90} className="object-cover object-[65%_60%] scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent" />
        </div>
        <div className="w-[min(1240px,100%-2.5rem)] mx-auto relative z-10">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2.5 before:w-7 before:h-px before:bg-current fade-up" style={{ animationDelay: "100ms" }}>
              Greater Sydney & Regional NSW
            </span>
            <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white mt-4 mb-3 leading-[1.05] fade-up" style={{ animationDelay: "180ms" }}>
              MOVE WITH <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">CONFIDENCE</span>.
            </h1>
            <p className="text-zinc-300 fade-up mb-8 text-lg sm:text-xl leading-relaxed" style={{ animationDelay: "220ms" }}>
              Premium taxi, Sydney airport transfer, luxury chauffeur & corporate mobility. Fixed rates, verified drivers, 24/7 reliability.
            </p>
          </div>
          <HeroBookingForm />
        </div>
      </section>

      {/* HP-2: Quick Action Cards */}
      <section className="py-16 sm:py-24 relative z-10 bg-[#080a11]">
        <div className="w-[min(1240px,100%-2.5rem)] mx-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((qa) => {
              const I = Icon[qa.icon];
              return (
                <Link
                  key={qa.id}
                  href={qa.href}
                  className="reveal p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#111624] to-[#0a0d16] hover:-translate-y-1.5 hover:border-amber-400/50 hover:shadow-[0_20px_40px_-15px_rgba(251,191,36,0.25)] transition-all duration-300 group"
                  id={`quick-action-${qa.id}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-400/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                      <I width={24} height={24} />
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-300 border border-amber-400/30 bg-amber-400/10">
                      {qa.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-white mt-6 text-xl tracking-tight">{qa.title}</h3>
                  <p className="text-zinc-400 mt-2 text-sm leading-relaxed">{qa.desc}</p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-amber-300 group-hover:text-amber-200">
                    Book now <Icon.arrow width={16} height={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* HP-3: Choose Your Ride */}
      <section className="py-16 sm:py-24 relative">
        <div className="w-[min(1240px,100%-2.5rem)] mx-auto">
          <div className="max-w-xl mb-12 reveal">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2.5 before:w-7 before:h-px before:bg-current">
              Services
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl tracking-tight text-white mt-3 mb-2">CHOOSE YOUR RIDE</h2>
            <p className="text-zinc-400 text-base sm:text-lg">Tailored mobility options engineered for every Sydney travel requirement.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RIDE_TYPES.map((rt) => (
              <Link
                key={rt.slug}
                href={rt.href}
                className="reveal flex flex-col justify-between p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#111624] to-[#0a0d16] hover:-translate-y-1.5 hover:border-amber-400/50 hover:shadow-[0_20px_40px_-15px_rgba(251,191,36,0.25)] transition-all duration-300 group"
              >
                <div>
                  <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl bg-white/5">
                    <Image src={rt.image} alt={rt.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-white text-xl">{rt.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-zinc-300 border border-white/10 bg-white/5">
                      {rt.pax} pax
                    </span>
                  </div>
                  <p className="text-zinc-400 mt-2 text-sm leading-relaxed">{rt.desc}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold">
                  <span className="text-zinc-400">Luggage capacity: {rt.luggage} bags</span>
                  <span className="flex items-center gap-1 text-amber-300 group-hover:translate-x-0.5 transition-transform">
                    Details <Icon.arrow width={14} height={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HP-4: How It Works */}
      <section className="py-16 sm:py-24 relative bg-[#080a11]">
        <div className="w-[min(1240px,100%-2.5rem)] mx-auto">
          <div className="max-w-xl mb-12 reveal">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2.5 before:w-7 before:h-px before:bg-current">
              Simplicity
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl tracking-tight text-white mt-3 mb-2">HOW IT WORKS</h2>
            <p className="text-zinc-400 text-base sm:text-lg">Fast on-demand taxi requests or pre-planned chauffeur bookings in 6 simple steps.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS.map((hw) => (
              <div key={hw.step} className="reveal p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#111624] to-[#0a0d16]">
                <span className="font-display text-4xl sm:text-5xl font-bold leading-none text-transparent [-webkit-text-stroke:1px_rgba(251,191,36,0.6)]">
                  {hw.step}
                </span>
                <h3 className="font-display font-semibold text-white mt-4 text-xl tracking-tight">{hw.title}</h3>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed">{hw.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HP-5: Fleet Preview */}
      <section className="py-16 sm:py-24 relative">
        <div className="w-[min(1240px,100%-2.5rem)] mx-auto">
          <div className="max-w-xl mb-12 reveal">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2.5 before:w-7 before:h-px before:bg-current">
              Fleet
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl tracking-tight text-white mt-3 mb-2">OUR LUXURY FLEET</h2>
            <p className="text-zinc-400 text-base sm:text-lg">Meticulously maintained, late-model vehicles driven by professional chauffeurs.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FLEET_PREVIEW.map((fl) => (
              <div key={fl.category} className="reveal p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#111624] to-[#0a0d16] hover:-translate-y-1.5 hover:border-amber-400/50 hover:shadow-[0_20px_40px_-15px_rgba(251,191,36,0.25)] transition-all duration-300 group">
                <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl bg-white/5">
                  <Image src={fl.image} alt={fl.category} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-white text-xl">{fl.category}</h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-zinc-300 border border-white/10 bg-white/5">
                      {fl.pax} pax
                    </span>
                  </div>
                </div>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed">{fl.desc}</p>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-zinc-400">{fl.luggage} Luggage Capacity</span>
                  <Link
                    href={fl.href}
                    className="inline-flex items-center justify-center h-[34px] px-3.5 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-amber-400/10 hover:border-amber-400/40 hover:text-white transition-all"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HP-6: Trust & Extras */}
      <section className="py-16 sm:py-24 relative bg-[#080a11]" id="corporate">
        <div className="w-[min(1240px,100%-2.5rem)] mx-auto">
          <div className="reveal grid gap-8 p-8 md:grid-cols-2 lg:items-center rounded-3xl border border-white/10 bg-[#0e121d]/90 backdrop-blur-2xl shadow-2xl">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2.5 before:w-7 before:h-px before:bg-current">
                Enterprise
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-white mt-2">CORPORATE & BUSINESS TRAVEL</h2>
              <p className="text-zinc-300 mt-4 leading-relaxed">
                Streamline mobility for your executives, clients and guests. One portal, multiple users, flexible credit limits and automated monthly invoicing.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                <li className="flex items-center gap-3"><Icon.check className="text-amber-400 shrink-0" /> Dedicated Account Manager & 24/7 Priority Support</li>
                <li className="flex items-center gap-3"><Icon.check className="text-amber-400 shrink-0" /> Consolidated Monthly Statements & Tax Invoices</li>
                <li className="flex items-center gap-3"><Icon.check className="text-amber-400 shrink-0" /> Customized Booking Policies & Employee Access Control</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book/chauffeur"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95"
                >
                  Open Corporate Account
                </Link>
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center justify-center h-12 px-6 rounded-full font-semibold text-sm text-white/90 border border-white/15 bg-white/[0.03] hover:bg-white/10 transition active:scale-95"
                >
                  Contact Corporate Team
                </a>
              </div>
            </div>
            <div className="relative h-72 overflow-hidden rounded-2xl md:h-full min-h-[300px]">
              <Image src="/hero.png" alt="Corporate Transfer" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
