"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminBookingsApi, getAdminPlacesApi, getAdminVehiclesApi, money, sydneyTime, type BookingRecord, type PlaceRoute, type VehicleRecord } from "@/lib/api";

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [places, setPlaces] = useState<PlaceRoute[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bList, pList, vList] = await Promise.all([
          getAdminBookingsApi({ limit: 100 }),
          getAdminPlacesApi("", 100),
          getAdminVehiclesApi(),
        ]);
        setBookings(bList);
        setPlaces(pList);
        setVehicles(vList);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics
  const totalBookings = bookings.length;
  const activeRoutes = places.filter((p) => p.isActive !== false).length;
  const activeVehicles = vehicles.filter((v) => v.isActive !== false).length;

  const totalRevenueCents = bookings.reduce((sum, b) => {
    if (b.status !== "cancelled" && b.status !== "CANCELLED") {
      return sum + (b.fare?.total || 0);
    }
    return sum;
  }, 0);

  const pendingCount = bookings.filter((b) => (b.status || "").toLowerCase() === "pending").length;
  const confirmedCount = bookings.filter((b) => (b.status || "").toLowerCase() === "confirmed").length;
  const completedCount = bookings.filter((b) => (b.status || "").toLowerCase() === "completed").length;
  const cancelledCount = bookings.filter((b) => (b.status || "").toLowerCase() === "cancelled").length;

  const recentBookings = bookings.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-1">OPERATIONS OVERVIEW</span>
          <h1 className="display text-3xl font-semibold text-white">Sydney Dispatch Central</h1>
          <p className="mute text-xs mt-1">Real-time status of passenger bookings, fixed routes, and fleet inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/bookings" className="btn btn-gold btn-sm">
            Manage Bookings
          </Link>
          <Link href="/admin/places" className="btn btn-ghost btn-sm">
            Add Route Fare
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="glass p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Bookings</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </span>
          </div>
          <div className="display text-3xl font-bold text-white mb-1">
            {loading ? "..." : totalBookings}
          </div>
          <div className="text-[11px] text-white/50 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{pendingCount} pending</span>
            <span>dispatch review</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="glass p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Gross Revenue</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-gold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </span>
          </div>
          <div className="display text-3xl font-bold text-gold mb-1">
            {loading ? "..." : money(totalRevenueCents)}
          </div>
          <div className="text-[11px] text-white/50">
            Excluding cancellations
          </div>
        </div>

        {/* Active Routes */}
        <div className="glass p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Fixed Routes</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </span>
          </div>
          <div className="display text-3xl font-bold text-white mb-1">
            {loading ? "..." : `${activeRoutes}`}
          </div>
          <div className="text-[11px] text-white/50">
            {places.length} total mapped destinations
          </div>
        </div>

        {/* Active Fleet */}
        <div className="glass p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Fleet Categories</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </span>
          </div>
          <div className="display text-3xl font-bold text-white mb-1">
            {loading ? "..." : activeVehicles}
          </div>
          <div className="text-[11px] text-white/50">
            Across Taxi, Luxury & Vans
          </div>
        </div>
      </div>

      {/* Status Breakdown Bar */}
      <div className="glass p-6 rounded-2xl border border-white/10">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Trip Pipeline Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-xs uppercase text-amber-300 font-semibold">Pending</span>
            <div className="display text-2xl font-bold text-white mt-1">{pendingCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <span className="text-xs uppercase text-blue-300 font-semibold">Confirmed</span>
            <div className="display text-2xl font-bold text-white mt-1">{confirmedCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-xs uppercase text-emerald-300 font-semibold">Completed</span>
            <div className="display text-2xl font-bold text-white mt-1">{completedCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <span className="text-xs uppercase text-red-300 font-semibold">Cancelled</span>
            <div className="display text-2xl font-bold text-white mt-1">{cancelledCount}</div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Customer Bookings</h2>
            <p className="text-xs text-white/50">Latest trip orders placed across Sydney Airport Transfer</p>
          </div>
          <Link href="/admin/bookings" className="text-xs text-gold hover:underline">
            View All ({bookings.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Passenger</th>
                <th className="py-3 px-4">Journey</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Fare</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    Loading live bookings...
                  </td>
                </tr>
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => {
                  const pName = b.passengerName || b.passenger?.name || "Passenger";
                  const pPhone = b.passengerPhone || b.passenger?.phone || "";
                  const from = b.pickup?.name || b.pickupLocation?.address || "Sydney";
                  const to = b.destination?.name || b.dropoffLocation?.address || "Destination";
                  const status = (b.status || "pending").toLowerCase();

                  return (
                    <tr key={b._id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-gold">
                        {b.bookingNumber || b._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{pName}</div>
                        <div className="text-[11px] text-white/40">{pPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="truncate text-white" title={from}>
                          <span className="text-emerald-400 font-bold">●</span> {from}
                        </div>
                        <div className="truncate text-white/60" title={to}>
                          <span className="text-amber-400 font-bold">●</span> {to}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-white/80">
                          {b.vehicleDetails?.name || b.vehicleType || "Sedan"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {money(b.fare?.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            status === "confirmed"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : status === "cancelled"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-white/40">
                        {b.createdAt ? sydneyTime(b.createdAt) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
