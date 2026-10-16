"use client";

import { useEffect, useState } from "react";
import {
  getAdminBookingsApi,
  updateBookingStatusApi,
  cancelBookingApi,
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

const SERVICE_FILTERS = [
  { id: "all", label: "All Services" },
  { id: "taxi", label: "Taxi" },
  { id: "airport", label: "Airport" },
  { id: "chauffeur", label: "Chauffeur" },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // If searchTerm looks like a phone number, pass as phone query to server
      const isPhoneSearch = /^[\d\s+()-]+$/.test(searchTerm.trim()) && searchTerm.trim().length >= 3;

      const data = await getAdminBookingsApi({
        status: statusFilter !== "all" ? statusFilter : undefined,
        service: serviceFilter !== "all" ? serviceFilter : undefined,
        phone: isPhoneSearch ? searchTerm.trim() : undefined,
        limit: 100,
      });

      setBookings(data.bookings);
      setTotalCount(data.total);
    } catch (err) {
      console.error("Failed loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, serviceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  // Syncs with PATCH /api/v1/bookings/:refOrId/status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedBooking) return;
    setActionLoading(true);

    const refOrId = selectedBooking.bookingNumber || selectedBooking._id;
    const res = await updateBookingStatusApi(refOrId, {
      status: newStatus,
      paymentStatus: paymentStatus || selectedBooking.paymentStatus,
      notes: statusNote || selectedBooking.notes,
    });

    if (res.ok && res.booking) {
      setSelectedBooking(res.booking);
      fetchBookings();
    } else if (res.ok) {
      setSelectedBooking({
        ...selectedBooking,
        status: newStatus as any,
        notes: statusNote || selectedBooking.notes,
        paymentStatus: paymentStatus as any,
      });
      fetchBookings();
    } else {
      alert(res.error || "Failed to update booking status");
    }
    setActionLoading(false);
  };

  // Syncs with POST /api/v1/bookings/:refOrId/cancel
  const handleCancelBooking = async (refOrId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setActionLoading(true);

    const res = await cancelBookingApi(refOrId, statusNote || "Cancelled by dispatch administrator");
    if (res.ok) {
      if (selectedBooking) {
        setSelectedBooking({
          ...selectedBooking,
          status: "cancelled",
          cancellationReason: statusNote || "Cancelled by dispatch administrator",
        });
      }
      fetchBookings();
    } else {
      alert(res.error || "Failed to cancel booking");
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete/cancel this booking record?")) return;
    setActionLoading(true);
    const success = await deleteBookingApi(id);
    if (success) {
      setSelectedBooking(null);
      fetchBookings();
    } else {
      alert("Failed to delete booking");
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
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2 mb-1">
            DISPATCH CONTROL
          </span>
          <h1 className="font-display text-3xl font-semibold text-white tracking-tight">Passenger Bookings</h1>
          <p className="text-zinc-400 text-xs mt-1">Manage live rides, update dispatch statuses, and inspect trip itineraries</p>
        </div>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center justify-center gap-2 h-[38px] px-4 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-white/10 self-start sm:self-auto transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Refresh Feed
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
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
              className="w-full px-3.5 py-2 pl-9 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-xs focus:border-amber-400 focus:outline-none"
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

        {/* Service Pills & Count */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mr-1">Service:</span>
            {SERVICE_FILTERS.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  serviceFilter === s.id
                    ? "bg-white/20 text-white font-semibold border border-white/20"
                    : "text-white/50 hover:text-white bg-white/[0.03] border border-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-white/50 font-medium whitespace-nowrap">
            Showing <span className="text-white font-bold">{filteredBookings.length}</span> of <span className="text-amber-400 font-bold">{totalCount || bookings.length}</span> total
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
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
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
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
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0e121d]/95 backdrop-blur-2xl shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2 mb-1">
                  BOOKING DETAILS
                </span>
                <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                  Ref: <span className="text-amber-400 font-mono">{selectedBooking.bookingNumber || selectedBooking._id}</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1">
                      Payment Status:
                    </label>
                    <select
                      value={paymentStatus || selectedBooking.paymentStatus || "pending"}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="pending" className="bg-[#0e121d] text-white">Pending</option>
                      <option value="paid" className="bg-[#0e121d] text-white">Paid</option>
                      <option value="cash_to_driver" className="bg-[#0e121d] text-white">Cash to Driver</option>
                      <option value="card" className="bg-[#0e121d] text-white">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 font-semibold mb-1">
                      Quick Status Transition:
                    </label>
                    <div className="text-[11px] text-white/40 pt-2">
                      Current: <span className="font-semibold text-amber-400 capitalize">{selectedBooking.status || "pending"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">
                    Dispatcher Notes / Cancellation Reason:
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Enter dispatch notes, assigned driver name, or reason for status update..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-amber-400"
                  />
                </div>
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
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition disabled:opacity-50"
                  >
                    Mark Pending
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("confirmed")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("assigned")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition disabled:opacity-50"
                  >
                    Assign Driver
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition disabled:opacity-50"
                  >
                    In Progress
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("completed")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleCancelBooking(selectedBooking.bookingNumber || selectedBooking._id)}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition disabled:opacity-50"
                  >
                    Cancel Trip
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                disabled={actionLoading}
                onClick={() => handleDelete(selectedBooking._id)}
                className="text-red-400 hover:text-red-300 text-xs px-3.5 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                Delete Record
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/20 transition"
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
