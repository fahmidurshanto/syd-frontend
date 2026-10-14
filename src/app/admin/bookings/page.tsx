"use client";

import { useEffect, useState } from "react";
import {
  getAdminBookingsApi,
  updateBookingStatusApi,
  deleteBookingApi,
  money,
  sydneyTime,
  type BookingRecord,
} from "@/lib/api";

const STATUS_FILTERS = [
  { id: "all", label: "All Bookings" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getAdminBookingsApi({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
        limit: 200,
      });
      setBookings(data);
    } catch (err) {
      console.error("Failed loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedBooking) return;
    setActionLoading(true);
    const ok = await updateBookingStatusApi(selectedBooking._id, newStatus, statusNote);
    if (ok) {
      setSelectedBooking({
        ...selectedBooking,
        status: newStatus as any,
        notes: statusNote || selectedBooking.notes,
      });
      fetchBookings();
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking record?")) return;
    setActionLoading(true);
    const ok = await deleteBookingApi(id);
    if (ok) {
      setSelectedBooking(null);
      fetchBookings();
    }
    setActionLoading(false);
  };

  // Client-side search filtering fallback
  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const ref = (b.bookingNumber || b._id).toLowerCase();
    const name = (b.passengerName || b.passenger?.name || "").toLowerCase();
    const phone = (b.passengerPhone || b.passenger?.phone || "").toLowerCase();
    const email = (b.passengerEmail || b.passenger?.email || "").toLowerCase();
    const from = (b.pickup?.name || b.pickupLocation?.address || "").toLowerCase();
    const to = (b.destination?.name || b.dropoffLocation?.address || "").toLowerCase();
    return ref.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q) || from.includes(q) || to.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-1">DISPATCH CONTROL</span>
          <h1 className="display text-3xl font-semibold text-white">Passenger Bookings</h1>
          <p className="mute text-xs mt-1">Manage live rides, update dispatch statuses, and inspect trip itineraries</p>
        </div>
        <button
          onClick={fetchBookings}
          className="btn btn-ghost btn-sm self-start sm:self-auto flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Refresh Feed
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === f.id
                  ? "bg-amber-400 text-black font-semibold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ref, passenger, phone..."
            className="w-full px-3.5 py-2 pl-9 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-xs focus:border-gold-400 focus:outline-none"
          />
          <svg
            className="absolute left-3 top-2.5 text-white/40"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </form>
      </div>

      {/* Main Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Pickup / Dropoff</th>
                <th className="py-3 px-4">Service & Vehicle</th>
                <th className="py-3 px-4">Fare</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    Loading live bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    No bookings found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const pName = b.passengerName || b.passenger?.name || "Passenger";
                  const pPhone = b.passengerPhone || b.passenger?.phone || "";
                  const pEmail = b.passengerEmail || b.passenger?.email || "";
                  const from = b.pickup?.name || b.pickupLocation?.address || "Sydney";
                  const to = b.destination?.name || b.dropoffLocation?.address || "Destination";
                  const status = (b.status || "pending").toLowerCase();

                  return (
                    <tr
                      key={b._id}
                      onClick={() => {
                        setSelectedBooking(b);
                        setStatusNote(b.notes || "");
                      }}
                      className="hover:bg-white/5 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-gold">
                        {b.bookingNumber || b._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{pName}</div>
                        <div className="text-[11px] text-white/40">{pPhone}</div>
                        {pEmail && <div className="text-[10px] text-white/30 truncate max-w-[140px]">{pEmail}</div>}
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="truncate text-white" title={from}>
                          <span className="text-emerald-400 font-bold">●</span> {from}
                        </div>
                        <div className="truncate text-white/60" title={to}>
                          <span className="text-amber-400 font-bold">●</span> {to}
                        </div>
                        {b.flightNumber && (
                          <div className="text-[10px] text-amber-300/80 mt-0.5">
                            Flight: {b.flightNumber} ({b.airportTripType || "transfer"})
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="capitalize text-white font-medium">
                          {b.service}
                        </div>
                        <div className="text-[11px] text-white/50">
                          {b.vehicleDetails?.name || b.vehicleType || "Sedan"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {money(b.fare?.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
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
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                            setStatusNote(b.notes || "");
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details & Status Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-white/10 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="eyebrow mb-1">BOOKING DETAILS</span>
                <h2 className="display text-2xl font-bold text-white">
                  Ref: <span className="text-gold font-mono">{selectedBooking.bookingNumber || selectedBooking._id}</span>
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6 space-y-6 text-xs">
              {/* Passenger Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <span className="text-white/40 block mb-1">Passenger Name</span>
                  <strong className="text-white text-sm">
                    {selectedBooking.passengerName || selectedBooking.passenger?.name || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Phone Number</span>
                  <a
                    href={`tel:${selectedBooking.passengerPhone || selectedBooking.passenger?.phone || ""}`}
                    className="text-gold hover:underline text-sm font-semibold"
                  >
                    {selectedBooking.passengerPhone || selectedBooking.passenger?.phone || "N/A"}
                  </a>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Email</span>
                  <span className="text-white/80">
                    {selectedBooking.passengerEmail || selectedBooking.passenger?.email || "N/A"}
                  </span>
                </div>
              </div>

              {/* Journey Itinerary */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="text-white/40 font-semibold uppercase tracking-wider text-[10px]">Journey Route</div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1"></span>
                    <div>
                      <div className="text-white font-medium">
                        {selectedBooking.pickup?.name || selectedBooking.pickupLocation?.address || "Sydney"}
                      </div>
                      <div className="text-white/40 text-[11px]">
                        {selectedBooking.pickup?.address || "Pickup Point"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1"></span>
                    <div>
                      <div className="text-white font-medium">
                        {selectedBooking.destination?.name || selectedBooking.dropoffLocation?.address || "Destination"}
                      </div>
                      <div className="text-white/40 text-[11px]">
                        {selectedBooking.destination?.address || "Dropoff Point"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight, Passengers & Vehicle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <span className="text-white/40 block mb-1">Vehicle</span>
                  <span className="text-white font-semibold capitalize">
                    {selectedBooking.vehicleDetails?.name || selectedBooking.vehicleType || "Sedan"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Passengers</span>
                  <span className="text-white font-semibold">
                    {selectedBooking.passengers || 1} Pax
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Flight Number</span>
                  <span className="text-white font-semibold font-mono">
                    {selectedBooking.flightNumber || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Total Fare</span>
                  <span className="text-gold font-bold text-sm">
                    {money(selectedBooking.fare?.total)}
                  </span>
                </div>
              </div>

              {/* Dispatch Action & Notes */}
              <div className="space-y-3 pt-2">
                <label className="block text-white/70 font-semibold">
                  Dispatcher Notes & Driver Assignment:
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Enter dispatch notes, assigned driver name, or cancellation reason..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Status Update Controls */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                <div className="text-white/60 font-semibold uppercase tracking-wider text-[10px]">
                  Change Dispatch Status
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("pending")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  >
                    Mark Pending
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("confirmed")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                  >
                    Confirm Booking
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("completed")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  >
                    Mark Completed
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("cancelled")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                disabled={actionLoading}
                onClick={() => handleDelete(selectedBooking._id)}
                className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition"
              >
                Delete Record
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
