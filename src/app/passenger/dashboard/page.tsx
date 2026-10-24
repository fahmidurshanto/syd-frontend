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
      <div className="py-12 px-4 max-w-4xl mx-auto">
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
    <div className="py-12 px-4 w-[min(1240px,100%-2rem)] mx-auto">
      {/* Header Profile Bar */}
      <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-xl flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 grid place-items-center text-zinc-950 font-display font-bold text-2xl shadow-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Passenger Account
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
              {user?.name}
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              {user?.email} · {user?.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/book/taxi"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full font-semibold text-xs text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95"
          >
            Book New Ride
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full font-semibold text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition active:scale-95 border border-white/10"
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
                    className="p-5 rounded-2xl border border-amber-400/30 bg-amber-400/5 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm text-amber-400">
                          #{trip.bookingNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300">
                          {trip.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">
                        {trip.pickup?.name} ➔ {trip.destination?.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {trip.vehicleType?.toUpperCase()} · {money(trip.fare?.total)}
                      </p>
                    </div>

                    <button
                      onClick={() => setTrackingBooking(trip)}
                      className="px-5 py-2.5 rounded-full font-semibold text-xs text-zinc-950 bg-amber-400 hover:bg-amber-300 transition shadow-md active:scale-95"
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
            <h2 className="font-display font-bold text-xl text-white mb-4">Past Trips</h2>
            {pastTrips.length === 0 ? (
              <div className="p-8 rounded-2xl border border-white/5 bg-zinc-900/40 text-center">
                <p className="text-zinc-400 text-sm">No past trips recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastTrips.map((trip) => (
                  <div
                    key={trip._id}
                    className="p-4 rounded-2xl border border-white/5 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-zinc-300">
                          #{trip.bookingNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            trip.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>
                      <p className="text-zinc-300">
                        {trip.pickup?.name} ➔ {trip.destination?.name}
                      </p>
                      <p className="text-zinc-500 mt-0.5">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-bold text-sm text-zinc-200">
                        {money(trip.fare?.total)}
                      </span>
                      <p className="text-[10px] text-zinc-400">Paid</p>
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
