"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { API_URL, api } from "@/lib/api";
import { TripTracker } from "@/components/TripTracker";
import { Icon } from "@/components/Icon";

function TrackBookingContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const [bookingRef, setBookingRef] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);

  const lookupBooking = async (refToFind: string) => {
    const clean = refToFind.trim().toUpperCase();
    if (!clean) return setError("Please enter your Booking Reference (e.g. SYD-ABC123)");

    setError("");
    setLoading(true);
    try {
      const res = await api<{ success: boolean; booking: any }>(`/bookings/${clean}`);
      if (res.booking) {
        setBooking(res.booking);
      } else {
        setError("Booking not found. Please check your reference code.");
      }
    } catch (err: any) {
      setError(err.message || "Booking reference not found. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      lookupBooking(initialRef);
    }
  }, [initialRef]);

  if (booking) {
    return (
      <div className="py-12">
        <div className="mb-6 max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setBooking(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            ← Track another booking
          </button>
        </div>
        <TripTracker booking={booking} onClose={() => setBooking(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-2xl text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 grid place-items-center mx-auto mb-5">
          <Icon.pin width={28} height={28} />
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white mb-2">
          Track Your Ride
        </h1>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Enter your 6-character booking reference code to view live driver location, arrival updates & interactive trip status.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupBooking(bookingRef);
          }}
          className="space-y-4"
        >
          <div className="relative text-left">
            <label
              htmlFor="track-ref"
              className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5"
            >
              Booking Reference
            </label>
            <input
              id="track-ref"
              type="text"
              placeholder="e.g. SYD-K8J2M1"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              className="h-14 w-full rounded-2xl px-4 text-center font-mono font-bold text-lg tracking-wider text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 focus:bg-[#07090e]/90 outline-none transition uppercase placeholder:text-zinc-600"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Searching for trip..." : "Track Live Status"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-xs text-zinc-500">
          Tip: You can find this reference in your confirmation screen or SMS message.
        </div>
      </div>
    </div>
  );
}

export default function TrackBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-zinc-400">Loading trip tracking...</div>}>
      <TrackBookingContent />
    </Suspense>
  );
}
