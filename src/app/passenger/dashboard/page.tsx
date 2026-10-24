"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearPassengerToken,
  getPassengerToken,
  money,
  passengerApi,
  PassengerUser,
} from "@/lib/api";
import { Icon } from "@/components/Icon";
import { TripTracker } from "@/components/TripTracker";

export default function PassengerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<PassengerUser | null>(null);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [trackingBooking, setTrackingBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    const token = getPassengerToken();
    if (!token) {
      router.push("/passenger/login");
      return;
    }

    try {
      const [profileRes, tripsRes] = await Promise.all([
        passengerApi<{ success: boolean; passenger: PassengerUser }>("/passengers/me"),
        passengerApi<{ success: boolean; activeTrips: any[]; pastTrips: any[] }>("/passengers/trips"),
      ]);

      setUser(profileRes.passenger);
      setActiveTrips(tripsRes.activeTrips || []);
      setPastTrips(tripsRes.pastTrips || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
      clearPassengerToken();
      router.push("/passenger/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    clearPassengerToken();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] grid place-items-center text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
          <span>Loading your profile & trips...</span>
        </div>
      </div>
    );
  }

  if (trackingBooking) {
    return (
      <div className="pt-28 pb-16 px-4 max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setTrackingBooking(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            ← Back to Passenger Dashboard
          </button>
        </div>
        <TripTracker booking={trackingBooking} onClose={() => setTrackingBooking(null)} />
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 px-4 w-[min(1240px,100%-2rem)] mx-auto">
      {/* Header Profile Bar */}
      <div className="p-5 sm:p-8 rounded-3xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 grid place-items-center text-zinc-950 font-display font-bold text-xl sm:text-2xl shadow-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Passenger Account
            </span>
            <h1 className="font-display font-bold text-xl sm:text-3xl text-white truncate">
              {user?.name}
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5 truncate">
              {user?.email} · {user?.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/book/taxi"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center h-11 px-5 rounded-full font-semibold text-xs text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95 text-center whitespace-nowrap"
          >
            Book New Ride
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center h-11 px-5 rounded-full font-semibold text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition active:scale-95 border border-white/10 text-center whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Trips */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Trips */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                Active Trips
                {activeTrips.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </h2>
            </div>

            {activeTrips.length === 0 ? (
              <div className="p-8 rounded-2xl border border-white/5 bg-zinc-900/40 text-center">
                <p className="text-zinc-400 text-sm">No active rides right now.</p>
                <Link
                  href="/book/airport"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline mt-2 font-semibold"
                >
                  Schedule an Airport Transfer →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrips.map((trip) => (
                  <div
                    key={trip._id}
                    className="p-5 rounded-2xl border border-amber-400/30 bg-amber-400/5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm text-amber-400">
                          #{trip.bookingNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300">
                          {trip.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium break-words">
                        {trip.pickup?.name} ➔ {trip.destination?.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {trip.vehicleType?.toUpperCase()} · {money(trip.fare?.total)}
                      </p>
                    </div>

                    <button
                      onClick={() => setTrackingBooking(trip)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-full font-semibold text-xs text-zinc-950 bg-amber-400 hover:bg-amber-300 transition shadow-md active:scale-95 text-center shrink-0"
                    >
                      Open Live Tracker
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past Trips */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-white">Past Trips ({pastTrips.length})</h2>
              {pastTrips.length > 0 && (
                <span className="text-xs font-mono text-zinc-400">Completed & Cancelled</span>
              )}
            </div>

            {pastTrips.length === 0 ? (
              <div className="p-8 rounded-2xl border border-white/5 bg-zinc-900/40 text-center">
                <p className="text-zinc-400 text-sm">No past trips recorded yet.</p>
                <p className="text-zinc-500 text-xs mt-1">When you complete your bookings, their history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastTrips.map((trip) => (
                  <div
                    key={trip._id}
                    className="p-5 rounded-2xl border border-white/10 bg-[#0e121d]/80 hover:border-white/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-amber-300 bg-white/5 px-2.5 py-1 rounded-md">
                          #{trip.bookingNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            trip.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {trip.status}
                        </span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/20">
                          {trip.service || "Taxi"}
                        </span>
                        <span className="text-zinc-400 text-xs">
                          {new Date(trip.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold mt-0.5">●</span>
                          <span className="text-zinc-400">From:</span>
                          <span className="text-zinc-200 font-medium">
                            {trip.pickup?.name || trip.pickup?.address || "Pickup"}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold mt-0.5">●</span>
                          <span className="text-zinc-400">To:</span>
                          <span className="text-zinc-200 font-medium">
                            {trip.destination?.name || trip.destination?.address || "As Directed"}
                          </span>
                        </div>
                      </div>

                      {trip.driver && (
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 pt-1">
                          <span>Driver: <strong className="text-zinc-300 font-medium">{trip.driver.name}</strong></span>
                          {trip.driver.phone && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-zinc-400">{trip.driver.phone}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 shrink-0">
                      <span className="font-display font-bold text-base text-zinc-100">
                        {money(trip.fare?.total)}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium capitalize mt-0.5">
                        {trip.paymentStatus || "Paid"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Col: Saved Places & Profile Perks */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl">
            <h3 className="font-display font-bold text-base text-white mb-3 flex items-center gap-2">
              <Icon.pin width={16} height={16} className="text-amber-400" />
              Quick Transfer Shortcuts
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Book your most common Sydney Airport destinations in one click.
            </p>

            <div className="space-y-2">
              <Link
                href="/book/airport?from=%7B%22name%22%3A%22Sydney+Airport+(SYD)%22%2C%22lat%22%3A-33.9399%2C%22lng%22%3A151.1753%2C%22code%22%3A%22SYD%22%7D"
                className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5 text-xs text-zinc-200"
              >
                ✈️ Sydney Airport (SYD) Pickup
              </Link>
              <Link
                href="/book/taxi?to=%7B%22name%22%3A%22Sydney+CBD%22%2C%22lat%22%3A-33.8688%2C%22lng%22%3A151.2093%2C%22code%22%3A%22CBD%22%7D"
                className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5 text-xs text-zinc-200"
              >
                🏢 Sydney CBD & Circular Quay
              </Link>
              <Link
                href="/book/chauffeur?to=%7B%22name%22%3A%22Bondi+Beach%22%2C%22lat%22%3A-33.8915%2C%22lng%22%3A151.2767%7D"
                className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5 text-xs text-zinc-200"
              >
                🏖️ Bondi Beach Luxury Transfer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
