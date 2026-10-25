"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, API_URL, money, type Place, type QuoteOption, type Service } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { PlaceInput } from "@/components/PlaceInput";
import { TripTracker } from "@/components/TripTracker";

const parsePlace = (raw: string | null): Place | null => {
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw)); } catch { return null; }
};

function BookingForm({ service }: { service: Service }) {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState<Place | null>(parsePlace(searchParams.get("from")));
  const [to, setTo] = useState<Place | null>(parsePlace(searchParams.get("to")));
  const [when, setWhen] = useState(searchParams.get("when") ? new Date(searchParams.get("when")!).toISOString().slice(0, 16) : "");
  const [passengers, setPassengers] = useState(Number(searchParams.get("pax")) || 1);
  const [flightNumber, setFlightNumber] = useState("");
  const [airportTripType, setAirportTripType] = useState<"pickup" | "dropoff">("pickup");

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(null);

  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // If logged in as passenger, prefill contact info
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("passenger_info");
        if (raw) {
          const info = JSON.parse(raw);
          if (info.name) setPassengerName(info.name);
          if (info.phone) setPassengerPhone(info.phone);
          if (info.email) setPassengerEmail(info.email);
        }
      } catch {
        // ignore
      }

      // If token exists, fetch fresh profile from /passengers/me
      const token = localStorage.getItem("syd_passenger_token");
      if (token) {
        fetch(`${API_URL}/api/v1/passengers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.passenger) {
              setPassengerName(data.passenger.name || "");
              setPassengerPhone(data.passenger.phone || "");
              setPassengerEmail(data.passenger.email || "");
              localStorage.setItem("passenger_info", JSON.stringify(data.passenger));
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const getQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from) return setError("Please select a pickup location");
    if (service !== "chauffeur" && !to) return setError("Please select a destination");
    setError("");
    setLoading(true);
    try {
      const res = await api<{ options: QuoteOption[] }>("/quotes", {
        json: {
          service,
          pickup: from,
          destination: to ?? undefined,
          pickupAt: when ? new Date(when).toISOString() : undefined,
          passengers,
        },
      });
      setOptions(res.options);
      if (res.options.length > 0) setSelectedQuote(res.options[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    if (!passengerName) return setError("Passenger name is required");
    if (!passengerPhone) return setError("Phone number is required");
    setError("");
    setLoading(true);
    try {
      const res = await api<{ booking: any }>("/bookings", {
        json: {
          quoteToken: selectedQuote.quoteToken,
          passengerName,
          passengerPhone,
          passengerEmail: passengerEmail || undefined,
          flightNumber: flightNumber || undefined,
          airportTripType: flightNumber ? airportTripType : undefined,
        },
      });
      setBookingResult({
        ...res.booking,
        pickup: from,
        destination: to,
        fare: selectedQuote.price,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (bookingResult) {
    return (
      <TripTracker
        booking={bookingResult}
        onClose={() => {
          setBookingResult(null);
          window.location.href = "/";
        }}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-xl">
        <h2 className="font-display font-semibold text-2xl tracking-tight text-white mb-6">1. Trip Details</h2>
        <form onSubmit={getQuote} className="space-y-4">
          <PlaceInput id="book-from" label="Pickup Location" placeholder="Airport, hotel or address" value={from} onChange={setFrom} icon="pin" allowLocate />
          <PlaceInput id="book-to" label="Destination" placeholder="Where to?" value={to} onChange={setTo} icon="flag" />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative flex flex-col gap-1.5 min-w-0">
              <label htmlFor="book-when" className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Pickup Date & Time</label>
              <input
                id="book-when"
                type="datetime-local"
                className="h-[52px] w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/60 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
            <div className="relative flex flex-col gap-1.5 min-w-0">
              <label htmlFor="book-pax" className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Passengers</label>
              <input
                id="book-pax"
                type="number"
                min="1"
                max="14"
                className="h-[52px] w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/60 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Show flight number and transfer type if either pickup or destination is airport */}
          {((from?.name && /airport/i.test(from.name)) || (to?.name && /airport/i.test(to.name))) && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-white/10">
              <div className="relative flex flex-col gap-1.5 min-w-0">
                <label htmlFor="book-flight-type" className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Transfer Type</label>
                <select
                  id="book-flight-type"
                  className="h-[52px] w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/60 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition cursor-pointer"
                  value={airportTripType}
                  onChange={(e: any) => setAirportTripType(e.target.value)}
                >
                  <option value="pickup" className="bg-[#0b0e17] text-white">Airport Pickup</option>
                  <option value="dropoff" className="bg-[#0b0e17] text-white">Airport Drop-off</option>
                </select>
              </div>
              <div className="relative flex flex-col gap-1.5 min-w-0">
                <label htmlFor="book-flight-num" className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Flight Number</label>
                <input
                  id="book-flight-num"
                  type="text"
                  placeholder="e.g. QF1"
                  className="h-[52px] w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/60 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && <div className="text-red-400 text-sm mt-1">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg mt-6 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Calculating Fare..." : "Calculate Fare & Options"}
          </button>
        </form>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-xl">
        <h2 className="font-display font-semibold text-2xl tracking-tight text-white mb-6">2. Vehicle & Checkout</h2>
        {options.length === 0 ? (
          <div className="text-zinc-400 text-center py-12">
            <Icon.car className="mx-auto mb-3 opacity-40 text-amber-400" width={48} height={48} />
            <p className="text-sm">Enter your pickup & destination details to view instant quotes.</p>
          </div>
        ) : (
          <form onSubmit={confirmBooking} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Select Vehicle</label>
              {options.map((opt) => (
                <div
                  key={opt.category.slug}
                  onClick={() => setSelectedQuote(opt)}
                  className={`p-3.5 sm:p-4 rounded-2xl cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
                    selectedQuote?.category.slug === opt.category.slug
                      ? "border-amber-400/80 bg-amber-400/10 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]"
                      : "border-white/10 bg-[#07090e]/50 hover:border-white/20 hover:bg-[#07090e]/80"
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg text-white">{opt.category.name}</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">{opt.category.passengersMax} Passengers · {opt.category.luggage} Bags</p>
                  </div>
                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    <span className="font-display font-bold text-lg sm:text-xl text-amber-400">{money(opt.price.total)}</span>
                    <p className="text-zinc-400 text-[11px]">GST incl.</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="relative flex flex-col gap-1.5 min-w-0">
                <label htmlFor="book-name" className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Passenger Name</label>
                <input
                  id="book-name"
                  type="text"
                  placeholder="John Doe"
                  className="h-[52px] w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/60 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  required
                />
              </div>
              <div className="relative flex flex-col gap-1.5 min-w-0">
                <label htmlFor="book-phone" className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Passenger Mobile Phone</label>
                <input
                  id="book-phone"
                  type="tel"
                  placeholder="0412 345 678"
                  className="h-[52px] w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/60 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedQuote}
              className="w-full inline-flex items-center justify-center h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg mt-6 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing Booking..." : `Confirm & Book (${money(selectedQuote?.price.total)})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function BookingPage({ service }: { service: Service }) {
  const titles: Record<Service, string> = {
    taxi: "TAXI SERVICE BOOKING",
    airport: "AIRPORT & TRANSFER BOOKING",
    chauffeur: "LIMOUSINE & CHAUFFEUR SERVICE",
  };
  return (
    <div className="py-20 sm:py-28 pt-32 relative">
      <div className="w-[min(1240px,100%-2.5rem)] mx-auto">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2.5 before:w-7 before:h-px before:bg-current">
            Instant Quote & Reserve
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl tracking-tight text-white mt-3 mb-2">{titles[service]}</h1>
          <p className="text-zinc-400 text-base sm:text-lg">Transparent fixed pricing, zero hidden surges. Fully driver-matched & tracked.</p>
        </div>
        <Suspense fallback={<div className="h-96 w-full rounded-2xl bg-white/5 animate-pulse" />}>
          <BookingForm service={service} />
        </Suspense>
      </div>
    </div>
  );
}
