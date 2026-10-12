"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type Place,
  type PlaceRoute,
  type Service,
  lookupRouteFareApi,
  getPopularRoutesApi,
  getConnectedPlacesApi,
  normalizePlace,
} from "@/lib/api";
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

  // Connected destinations available exclusively from the selected "from" place
  const [availableDestinations, setAvailableDestinations] = useState<Place[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Route lookup state from places.controller.ts GET /places/lookup
  const [routeFare, setRouteFare] = useState<PlaceRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Popular routes catalog from places.controller.ts GET /places
  const [popularRoutes, setPopularRoutes] = useState<PlaceRoute[]>([]);

  const isNow = service === "taxi" && now;

  // Load popular predefined routes on component mount
  useEffect(() => {
    getPopularRoutesApi(6).then((routes) => {
      if (routes?.length) {
        setPopularRoutes(routes);
      }
    });
  }, []);

  // When "from" changes, dynamically query server for available routes connected to it
  useEffect(() => {
    if (!from?.name) {
      setAvailableDestinations([]);
      setTo(null);
      setRouteFare(null);
      return;
    }

    let active = true;
    setLoadingDestinations(true);

    getConnectedPlacesApi(from.name)
      .then((destinations) => {
        if (!active) return;
        setAvailableDestinations(destinations);

        // If a destination was already selected, verify it is in the newly returned routes list
        setTo((currentTo) => {
          if (!currentTo) return null;
          const isStillValid = destinations.some(
            (d) => d.name.toLowerCase() === currentTo.name.toLowerCase()
          );
          return isStillValid ? currentTo : null;
        });
      })
      .catch(() => {
        if (active) setAvailableDestinations([]);
      })
      .finally(() => {
        if (active) setLoadingDestinations(false);
      });

    return () => {
      active = false;
    };
  }, [from?.name]);

  // When both from and to are selected, perform automatic fare lookup via GET /places/lookup
  useEffect(() => {
    if (!from?.name || !to?.name) {
      setRouteFare(null);
      return;
    }
    let cancelled = false;
    setRouteLoading(true);

    lookupRouteFareApi(from.name, to.name)
      .then((fare) => {
        if (!cancelled) setRouteFare(fare);
      })
      .catch(() => {
        if (!cancelled) setRouteFare(null);
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from?.name, to?.name]);

  const handleFromChange = (p: Place | null) => {
    setFrom(p);
    if (p) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.from;
        return next;
      });
    }
  };

  const handleToChange = (p: Place | null) => {
    setTo(p);
    if (p) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.to;
        return next;
      });
    }
  };

  const swapLocations = () => {
    if (!from || !to) return;
    const currentFrom = from;
    const currentTo = to;
    setFrom(currentTo);
    setTo(currentFrom);
  };

  const selectPopularRoute = (route: PlaceRoute) => {
    const pickupPlace = normalizePlace({
      name: route.firstPlace,
      address: route.firstPlaceDetails?.address,
      lat: route.firstPlaceDetails?.lat,
      lng: route.firstPlaceDetails?.lng,
      code: route.firstPlaceDetails?.code,
    });
    const destPlace = normalizePlace({
      name: route.lastPlace,
      address: route.lastPlaceDetails?.address,
      lat: route.lastPlaceDetails?.lat,
      lng: route.lastPlaceDetails?.lng,
      code: route.lastPlaceDetails?.code,
    });

    setFrom(pickupPlace);
    setTo(destPlace);
    setErrors({});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!from) err.from = "Choose a pickup location from the list";
    if (!to) err.to = "Choose a destination from available routes";
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
        <div className="relative z-20">
          <PlaceInput
            id="hero-from"
            label="From"
            placeholder={service === "airport" ? "Airport, hotel or address" : "Pickup location"}
            value={from}
            onChange={handleFromChange}
            icon="pin"
            error={errors.from}
            allowLocate
          />
          {from && to && (
            <button
              type="button"
              onClick={swapLocations}
              className="absolute top-0 right-0 text-[0.72rem] tracking-normal normal-case flex items-center gap-1 font-medium transition-colors hover:text-white"
              style={{ color: "var(--gold-400)" }}
              title="Swap pickup and destination"
              id="hero-swap-locations"
            >
              <Icon.swap width={13} height={13} />
              <span>Swap</span>
            </button>
          )}
        </div>
        <div className="relative z-10">
          <PlaceInput
            id="hero-to"
            label="To"
            placeholder={
              !from
                ? "Select pickup first"
                : loadingDestinations
                ? "Loading available routes..."
                : availableDestinations.length > 0
                ? `Where to? (${availableDestinations.length} routes)`
                : "No routes available"
            }
            value={to}
            onChange={handleToChange}
            icon="flag"
            error={errors.to}
            disabled={!from || loadingDestinations}
            disabledMessage={!from ? "Select pickup first" : "Loading routes..."}
            allowedPlaces={from ? availableDestinations : null}
            onDisabledClick={() => {
              if (!from) {
                setErrors((prev) => ({
                  ...prev,
                  from: "Please choose a pickup location first",
                }));
              }
            }}
          />
        </div>
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
          <span className="label flex items-center justify-between">
            <span>Passengers</span>
            {routeFare && (routeFare.increaseFairPerPerson ?? routeFare.increaseFarePerPerson ?? 0) > 0 && (
              <span className="text-[10px] text-[var(--gold-400)] normal-case tracking-normal font-normal">
                +${routeFare.increaseFairPerPerson ?? routeFare.increaseFarePerPerson}/pax
              </span>
            )}
          </span>
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

      {/* Live Route Fare Estimate Banner (via GET /places/lookup) */}
      {routeLoading && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[hsl(40_62%_64%/0.08)] px-3 py-2 text-xs text-[var(--gold-400)] animate-pulse" id="hero-route-loading">
          <Icon.clock width={14} height={14} /> Looking up fixed route fare catalog...
        </div>
      )}

      {routeFare && !routeLoading && (() => {
        const baseFair = routeFare.fair ?? routeFare.fare ?? 0;
        const increasePerPerson = routeFare.increaseFairPerPerson ?? routeFare.increaseFarePerPerson ?? 0;
        const extraPax = Math.max(0, pax - 1);
        const totalCalculatedFair = baseFair + (extraPax * increasePerPerson);

        return (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[hsl(40_62%_64%/0.3)] bg-[hsl(40_62%_64%/0.08)] p-3 text-xs" id="hero-route-estimate">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="pill pill-gold py-0.5 px-2 text-[11px] font-semibold">Fixed Rate Route</span>
              <span className="text-sm font-bold text-white">
                ${totalCalculatedFair} {routeFare.currency || "AUD"}
              </span>
              {extraPax > 0 && increasePerPerson > 0 && (
                <span className="text-[11px] text-[var(--gold-300)] font-medium">
                  (${baseFair} base + ${extraPax * increasePerPerson} for {pax} pax)
                </span>
              )}
              {routeFare.distanceKm && <span className="dim">· {routeFare.distanceKm} km</span>}
              {routeFare.durationMin && <span className="dim">· ~{routeFare.durationMin} mins</span>}
              {routeFare.firstPlace && routeFare.lastPlace && (
                <span className="text-[var(--gold-300)] font-medium">
                  ({routeFare.firstPlace} ⇄ {routeFare.lastPlace})
                </span>
              )}
            </div>
            {routeFare.notes && <span className="mute italic text-[11px] truncate max-w-sm">{routeFare.notes}</span>}
          </div>
        );
      })()}

      {/* Popular Routes quick-select chips (via GET /places) */}
      {popularRoutes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-2 text-xs" id="hero-popular-routes">
          <span className="mute text-[11px] uppercase tracking-wider font-semibold">Popular routes:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {popularRoutes.map((r, i) => (
              <button
                key={r._id ?? `${r.firstPlace}-${r.lastPlace}-${i}`}
                type="button"
                onClick={() => selectPopularRoute(r)}
                className="pill hover:border-[var(--gold-400)] hover:text-white transition-all cursor-pointer text-xs py-1 px-2.5"
                id={`popular-route-${i}`}
              >
                <span className="text-white font-medium">{r.firstPlace.replace(" (SYD)", "")}</span>
                <span className="text-[var(--gold-400)] mx-1">⇄</span>
                <span>{r.lastPlace.replace(" (SYD)", "")}</span>
                <span className="text-[var(--gold-300)] font-semibold ml-1.5">${r.fair ?? r.fare}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

