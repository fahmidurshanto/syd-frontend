"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, money, type Place, type QuoteOption, type Service } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { PlaceInput } from "@/components/PlaceInput";

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
  const [bookingResult, setBookingResult] = useState<{ number: string; status: string } | null>(null);
  const [error, setError] = useState("");

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
      const res = await api<{ booking: { number: string; status: string } }>("/bookings", {
        json: {
          quoteToken: selectedQuote.quoteToken,
          passengerName,
          passengerPhone,
          flightNumber: service === "airport" ? flightNumber : undefined,
          airportTripType: service === "airport" ? airportTripType : undefined,
        },
      });
      setBookingResult(res.booking);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (bookingResult) {
    return (
      <div className="glass reveal max-w-xl mx-auto p-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full mx-auto mb-4" style={{ background: "hsl(152 55% 52% / 0.15)", color: "var(--success)" }}>
          <Icon.check width={32} height={32} />
        </div>
        <h2 className="display text-3xl">BOOKING CONFIRMED</h2>
        <p className="dim mt-2">Booking Reference: <strong className="text-gold">{bookingResult.number}</strong></p>
        <p className="mute mt-4 text-sm">Status: {bookingResult.status}. We have sent an SMS update to your phone number.</p>
        <button onClick={() => window.location.href = "/"} className="btn btn-gold mt-8">Return to Home</button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="glass p-6 sm:p-8">
        <h2 className="display text-2xl mb-6">1. Trip Details</h2>
        <form onSubmit={getQuote} className="space-y-4">
          <PlaceInput id="book-from" label="Pickup Location" placeholder="Airport, hotel or address" value={from} onChange={setFrom} icon="pin" allowLocate />
          <PlaceInput id="book-to" label="Destination" placeholder="Where to?" value={to} onChange={setTo} icon="flag" />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="book-when" className="label">Pickup Date & Time</label>
              <input id="book-when" type="datetime-local" className="input no-icon" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="book-pax" className="label">Passengers</label>
              <input id="book-pax" type="number" min="1" max="14" className="input no-icon" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} />
            </div>
          </div>

          {service === "airport" && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[var(--line)]">
              <div className="field">
                <label htmlFor="book-flight-type" className="label">Transfer Type</label>
                <select id="book-flight-type" className="input no-icon" value={airportTripType} onChange={(e: any) => setAirportTripType(e.target.value)}>
                  <option value="pickup">Airport Pickup</option>
                  <option value="dropoff">Airport Drop-off</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="book-flight-num" className="label">Flight Number</label>
                <input id="book-flight-num" type="text" placeholder="e.g. QF1" className="input no-icon" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
              </div>
            </div>
          )}

          {error && <div className="error-text text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-gold btn-block h-12 mt-6">
            {loading ? "Calculating Fare..." : "Calculate Fare & Options"}
          </button>
        </form>
      </div>

      <div className="glass p-6 sm:p-8">
        <h2 className="display text-2xl mb-6">2. Vehicle & Checkout</h2>
        {options.length === 0 ? (
          <div className="mute text-center py-12">
            <Icon.car className="mx-auto mb-3 opacity-40" width={48} height={48} />
            <p>Enter your pickup & destination details to view instant quotes.</p>
          </div>
        ) : (
          <form onSubmit={confirmBooking} className="space-y-6">
            <div className="space-y-3">
              <label className="label">Select Vehicle</label>
              {options.map((opt) => (
                <div
                  key={opt.category.slug}
                  onClick={() => setSelectedQuote(opt)}
                  className={`card p-4 cursor-pointer flex items-center justify-between border ${
                    selectedQuote?.category.slug === opt.category.slug ? "border-[var(--gold-400)] bg-[hsl(40_62%_64%/0.05)]" : "border-[var(--line)]"
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{opt.category.name}</h3>
                    <p className="mute text-xs">{opt.category.passengersMax} Passengers · {opt.category.luggage} Bags</p>
                  </div>
                  <div className="text-right">
                    <span className="display text-xl text-gold">{money(opt.price.total)}</span>
                    <p className="mute text-xs">GST incl.</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--line)]">
              <div className="field">
                <label htmlFor="book-name" className="label">Passenger Name</label>
                <input id="book-name" type="text" placeholder="John Doe" className="input no-icon" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="book-phone" className="label">Passenger Mobile Phone</label>
                <input id="book-phone" type="tel" placeholder="0412 345 678" className="input no-icon" value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} required />
              </div>
            </div>

            <button type="submit" disabled={loading || !selectedQuote} className="btn btn-gold btn-block h-12 mt-6">
              {loading ? "Processing Booking..." : `Confirm & Book (${money(selectedQuote?.price.total)})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function BookingPage({ service }: { service: Service }) {
  const titles: Record<Service, string> = { taxi: "TAXI BOOKING", airport: "AIRPORT TRANSFER", chauffeur: "LUXURY CHAUFFEUR" };
  return (
    <div className="section pt-32">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Instant Quote & Reserve</span>
          <h1 className="display">{titles[service]}</h1>
          <p className="dim">Transparent fixed pricing, zero hidden surges. Fully driver-matched & tracked.</p>
        </div>
        <Suspense fallback={<div className="skeleton h-96 w-full" />}>
          <BookingForm service={service} />
        </Suspense>
      </div>
    </div>
  );
}
