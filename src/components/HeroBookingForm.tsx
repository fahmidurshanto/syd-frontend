"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Place, Service } from "@/lib/api";
import { PlaceInput } from "./PlaceInput";
import { Icon } from "./Icon";

export const encodePlace = (p: Place) => encodeURIComponent(JSON.stringify({ name: p.name, address: p.address, lat: p.lat, lng: p.lng, code: p.code, type: p.type }));

/** HP-1: one form, service selector, form adapts to the service (F7). */
export function HeroBookingForm() {
  const router = useRouter();
  const [service, setService] = useState<Service>("airport");
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [now, setNow] = useState(false);
  const [when, setWhen] = useState("");
  const [pax, setPax] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isNow = service === "taxi" && now;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!from) err.from = "Choose a pickup from the list";
    if (!to) err.to = "Choose a destination from the list";
    if (!isNow && !when) err.when = "Choose a date and time";
    setErrors(err);
    if (Object.keys(err).length) return;
    const qs = new URLSearchParams({ pax: String(pax) });
    let url = `/book/${service}?${qs}&from=${encodePlace(from!)}&to=${encodePlace(to!)}`;
    if (!isNow) url += `&when=${encodeURIComponent(new Date(when).toISOString())}`;
    router.push(url);
  };

  return (
    <form onSubmit={submit} className="glass fade-up p-5 sm:p-6" style={{ animationDelay: "250ms" }} id="hero-booking-form" noValidate>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="segmented" role="group" aria-label="Service">
          {(["taxi", "airport", "chauffeur"] as Service[]).map((s) => (
            <button key={s} type="button" aria-pressed={service === s} onClick={() => { setService(s); if (s !== "taxi") setNow(false); }} id={`hero-service-${s}`}>
              {s === "taxi" ? "Taxi" : s === "airport" ? "Airport" : "Chauffeur"}
            </button>
          ))}
        </div>
        <span className="pill pill-live">Drivers online now</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_0.7fr_auto] lg:items-end">
        <PlaceInput id="hero-from" label="From" placeholder={service === "airport" ? "Airport, hotel or address" : "Pickup location"} value={from} onChange={setFrom} icon="pin" error={errors.from} allowLocate />
        <PlaceInput id="hero-to" label="To" placeholder="Where to?" value={to} onChange={setTo} icon="flag" error={errors.to} />
        <div className="field">
          <span className="label flex items-center justify-between">
            When
            {service === "taxi" && (
              <button type="button" onClick={() => setNow((n) => !n)} className="text-[0.7rem] tracking-normal normal-case" style={{ color: "var(--gold-400)" }} id="hero-now-toggle">
                {now ? "Schedule instead" : "Ride now"}
              </button>
            )}
          </span>
          {isNow ? (
            <div className="input flex items-center" style={{ color: "var(--gold-300)" }}>Now · pickup in minutes</div>
          ) : (
            <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} aria-invalid={!!errors.when} aria-label="Pickup date and time" id="hero-when" min={new Date(Date.now() + 30 * 60_000).toISOString().slice(0, 16)} />
          )}
          <Icon.clock className="input-icon" />
          {errors.when && <span className="error-text">{errors.when}</span>}
        </div>
        <div className="field">
          <span className="label">Passengers</span>
          <div className="stepper">
            <button type="button" onClick={() => setPax((p) => Math.max(1, p - 1))} disabled={pax <= 1} aria-label="Fewer passengers">−</button>
            <output aria-live="polite">{pax}</output>
            <button type="button" onClick={() => setPax((p) => Math.min(14, p + 1))} aria-label="More passengers">+</button>
          </div>
        </div>
        <button type="submit" className="btn btn-gold h-[52px] md:col-span-2 lg:col-span-1" id="hero-get-quote">
          Get quote <Icon.arrow />
        </button>
      </div>
    </form>
  );
}
