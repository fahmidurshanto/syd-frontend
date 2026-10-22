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
  getOnlineDriversApi,
  streamOnlineDriversEvents,
  type OnlineDriverInfo,
  normalizePlace,
} from "@/lib/api";
import { PlaceInput } from "./PlaceInput";
import { Icon } from "./Icon";

export const encodePlace = (p: Place) => encodeURIComponent(JSON.stringify({ name: p.name, address: p.address, lat: p.lat, lng: p.lng, code: p.code, type: p.type }));

/** HP-1: one form, service selector, form adapts to the service (F7). */
export function HeroBookingForm() {
  const router = useRouter();
  const [service, setService] = useState<Service>("taxi");
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [now, setNow] = useState(false);
  const [when, setWhen] = useState("");
  const [pax, setPax] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Connected destinations available exclusively from the selected "from" place
  const [availableDestinations, setAvailableDestinations] = useState<Place[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Route lookup state from routes.controller.ts GET /routes/lookup
  const [routeFare, setRouteFare] = useState<PlaceRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Popular routes catalog from routes.controller.ts GET /routes
  const [popularRoutes, setPopularRoutes] = useState<PlaceRoute[]>([]);

  // Online drivers data
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriverInfo[]>([]);
  const [showDriverList, setShowDriverList] = useState(false);

  const isNow = service === "taxi" && now;

  // Real-time Driver Online/Offline stream listener (Zero-latency instant updates)
  useEffect(() => {
    // Initial fetch
    getOnlineDriversApi(service).then((res) => {
      setOnlineCount(res.count);
      setOnlineDrivers(res.drivers);
    });

    // Subscribe to live Server-Sent Events stream
    const unsubscribe = streamOnlineDriversEvents(service, (data) => {
      setOnlineCount(data.count);
      setOnlineDrivers(data.drivers);
    });

    return () => {
      unsubscribe();
    };
  }, [service]);

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
    <form
      onSubmit={submit}
      className="fade-up p-5 sm:p-6 rounded-2xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(3,6,12,0.8)]"
      style={{ animationDelay: "250ms" }}
      id="hero-booking-form"
      noValidate
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-full bg-[#07090e]/80 border border-white/10 gap-1" role="group" aria-label="Service">
          {(["taxi", "chauffeur"] as Service[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={service === s}
              onClick={() => { setService(s); if (s !== "taxi") setNow(false); }}
              id={`hero-service-${s}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                service === s
                  ? "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {s === "taxi" ? "Taxi" : "Limousine"}
            </button>
          ))}
        </div>

        {/* Live Online Drivers Indicator */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDriverList((v) => !v)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer"
            title="Click to view online fleet"
            id="hero-online-drivers-badge"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              <strong className="font-bold text-white">{onlineCount}</strong>{" "}
              {onlineCount === 1 ? "driver" : "drivers"} online now
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${showDriverList ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Quick Dropdown: Active Online Drivers */}
          {showDriverList && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#0e1320] p-3 shadow-2xl z-50 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
                <span className="font-semibold text-white">Active {service === "taxi" ? "Taxis" : "Limousines"}</span>
                <span className="text-emerald-400 font-mono text-[11px]">Ready for pickup</span>
              </div>
              {onlineDrivers.length === 0 ? (
                <p className="text-xs text-zinc-400 py-3 text-center">
                  No drivers currently online for {service === "taxi" ? "Taxi" : "Limousine"}. Pre-book is available 24/7!
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {onlineDrivers.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white flex items-center gap-1.5">
                          <span>{d.name}</span>
                          <span className="text-[10px] text-emerald-400">★ {d.rating?.toFixed(1) || "5.0"}</span>
                        </p>
                        <p className="text-[11px] text-zinc-400">{d.vehicleModel}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20 capitalize">
                        {d.serviceType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_0.7fr_auto] lg:items-end">
        <div className="relative z-20">
          <PlaceInput
            id="hero-from"
            label="From"
            placeholder="Pickup location"
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
              className="absolute top-0 right-0 text-[11px] flex items-center gap-1 font-medium text-amber-400 hover:text-amber-300 transition-colors"
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
        <div className="relative flex flex-col gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 flex items-center justify-between">
            When
            {service === "taxi" && (
              <button
                type="button"
                onClick={() => setNow((n) => !n)}
                className="text-[11px] tracking-normal normal-case text-amber-400 hover:text-amber-300 font-normal"
                id="hero-now-toggle"
              >
                {now ? "Schedule instead" : "Ride now"}
              </button>
            )}
          </span>
          {isNow ? (
            <div className="h-[52px] w-full rounded-xl pl-11 pr-4 flex items-center text-sm font-semibold text-amber-300 border border-white/10 bg-[#07090e]/60">
              Now · pickup in minutes
            </div>
          ) : (
            <input
              type="datetime-local"
              className="h-[52px] w-full rounded-xl pl-11 pr-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/60 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              aria-invalid={!!errors.when}
              aria-label="Pickup date and time"
              id="hero-when"
              min={new Date(Date.now() + 30 * 60_000).toISOString().slice(0, 16)}
            />
          )}
          <Icon.clock className="absolute left-3.5 bottom-4 w-5 h-5 text-amber-400 pointer-events-none" />
          {errors.when && <span className="text-red-400 text-xs mt-0.5">{errors.when}</span>}
        </div>
        <div className="relative flex flex-col gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 flex items-center justify-between">
            <span>Passengers</span>
            {(() => {
              const rawPax = routeFare?.increaseFarePerPerson ?? routeFare?.increaseFairPerPerson;
              const paxSurcharge =
                typeof rawPax === "object" && rawPax !== null
                  ? (rawPax[service] ?? rawPax["taxi"] ?? Object.values(rawPax)[0] ?? 0)
                  : (Number(rawPax) || 0);

              if (paxSurcharge > 0) {
                return (
                  <span className="text-[10px] text-amber-400 normal-case tracking-normal font-normal">
                    +${paxSurcharge}/pax
                  </span>
                );
              }
              return null;
            })()}
          </span>
          <div className="flex items-center h-[52px] rounded-xl border border-white/10 bg-[#07090e]/60">
            <button
              type="button"
              onClick={() => setPax((p) => Math.max(1, p - 1))}
              disabled={pax <= 1}
              aria-label="Fewer passengers"
              className="w-11 h-full text-lg font-semibold text-amber-400 hover:text-amber-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition"
            >
              −
            </button>
            <output aria-live="polite" className="flex-1 text-center font-semibold text-white">
              {pax}
            </output>
            <button
              type="button"
              onClick={() => setPax((p) => Math.min(14, p + 1))}
              aria-label="More passengers"
              className="w-11 h-full text-lg font-semibold text-amber-400 hover:text-amber-300 transition"
            >
              +
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-[0_4px_25px_-5px_rgba(251,191,36,0.5)] md:col-span-2 lg:col-span-1 transition active:scale-95"
          id="hero-get-quote"
        >
          Get quote <Icon.arrow />
        </button>
      </div>

      {/* Live Route Fare Estimate Banner (via GET /places/lookup) */}
      {routeLoading && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-400/10 border border-amber-400/20 px-3.5 py-2 text-xs text-amber-300 animate-pulse" id="hero-route-loading">
          <Icon.clock width={14} height={14} /> Looking up fixed route fare catalog...
        </div>
      )}

      {routeFare && !routeLoading && (() => {
        const vehicleFares = (routeFare.vehicleAndFares || routeFare.vehicleFares || {}) as Record<string, number>;
        const baseFair =
          vehicleFares[service] ??
          vehicleFares["taxi"] ??
          (Object.values(vehicleFares)[0] as number | undefined) ??
          routeFare.fair ??
          routeFare.fare ??
          0;

        const rawPax = routeFare.increaseFarePerPerson ?? routeFare.increaseFairPerPerson;
        const increasePerPerson = typeof rawPax === "object" && rawPax !== null
          ? (rawPax[service] ?? rawPax["taxi"] ?? Object.values(rawPax)[0] ?? 0)
          : (Number(rawPax) || 0);

        const extraPax = Math.max(0, pax - 1);
        const totalCalculatedFair = baseFair + (extraPax * increasePerPerson);

        return (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs" id="hero-route-estimate">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-amber-300 border border-amber-400/40 bg-amber-400/15">
                Fixed Rate Route
              </span>
              <span className="text-sm font-bold text-white">
                ${totalCalculatedFair} {routeFare.currency || "AUD"}
              </span>
              {extraPax > 0 && increasePerPerson > 0 && (
                <span className="text-[11px] text-amber-300 font-medium">
                  (${baseFair} base + ${extraPax * increasePerPerson} for {pax} pax)
                </span>
              )}
              {routeFare.distanceKm && <span className="text-zinc-400">· {routeFare.distanceKm} km</span>}
              {routeFare.durationMin && <span className="text-zinc-400">· ~{routeFare.durationMin} mins</span>}
              {routeFare.firstPlace && routeFare.lastPlace && (
                <span className="text-amber-300 font-medium">
                  ({routeFare.firstPlace} ⇄ {routeFare.lastPlace})
                </span>
              )}
            </div>
            {routeFare.notes && <span className="text-zinc-400 italic text-[11px] truncate max-w-sm">{routeFare.notes}</span>}
          </div>
        );
      })()}

      {/* Popular Routes quick-select chips (via GET /places) */}
      {popularRoutes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs" id="hero-popular-routes">
          <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">Popular routes:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {popularRoutes.map((r, i) => (
              <button
                key={r._id ?? `${r.firstPlace}-${r.lastPlace}-${i}`}
                type="button"
                onClick={() => selectPopularRoute(r)}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-zinc-300 border border-white/10 bg-white/[0.03] hover:border-amber-400/50 hover:text-white transition-all cursor-pointer"
                id={`popular-route-${i}`}
              >
                <span className="text-white font-medium">{r.firstPlace.replace(" (SYD)", "")}</span>
                <span className="text-amber-400 mx-1">⇄</span>
                <span>{r.lastPlace.replace(" (SYD)", "")}</span>
                <span className="text-amber-300 font-semibold ml-1.5">${r.fair ?? r.fare}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

