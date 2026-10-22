"use client";

import { useEffect, useState } from "react";
import {
  getAdminDriversApi,
  sydneyTime,
  type DriverRecord,
} from "@/lib/api";

const STATUS_FILTERS = [
  { id: "all", label: "All Drivers" },
  { id: "active", label: "Active" },
  { id: "on_trip", label: "On Trip" },
  { id: "offline", label: "Offline" },
  { id: "suspended", label: "Suspended" },
];

const SERVICE_FILTERS = [
  { id: "all", label: "All Services" },
  { id: "taxi", label: "Taxi" },
  { id: "airport", label: "Airport" },
  { id: "chauffeur", label: "Chauffeur" },
];

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<DriverRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [driverNotes, setDriverNotes] = useState("");

  // Directly calls GET /api/v1/admins/drivers from AdminController
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await getAdminDriversApi({
        status: statusFilter !== "all" ? statusFilter : undefined,
        service: serviceFilter !== "all" ? serviceFilter : undefined,
        search: searchTerm.trim() || undefined,
        limit: 100,
      });

      if (Array.isArray(data.drivers)) {
        setDrivers(data.drivers);
        setTotalCount(data.total ?? data.drivers.length);
      } else {
        setDrivers([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Failed loading drivers from /api/v1/admins/drivers:", err);
      setDrivers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [statusFilter, serviceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrivers();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedDriver) return;
    setActionLoading(true);
    try {
      const { api } = await import("@/lib/api");
      await api(`/admins/drivers/${selectedDriver._id}/status`, {
        method: "PATCH",
        json: { status: newStatus, notes: driverNotes || selectedDriver.notes },
      });
      const updated: DriverRecord = {
        ...selectedDriver,
        status: newStatus as any,
        notes: driverNotes || selectedDriver.notes,
      };
      setSelectedDriver(updated);
      setDrivers((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d))
      );
    } catch (err: any) {
      console.error("Failed to update driver status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const num = (d.driverNumber || d._id).toLowerCase();
    const name = (d.name || "").toLowerCase();
    const phone = (d.phone || "").toLowerCase();
    const email = (d.email || "").toLowerCase();
    const plate = (d.vehiclePlate || "").toLowerCase();
    const model = (d.vehicleModel || "").toLowerCase();
    const loc = (d.location?.name || "").toLowerCase();
    return (
      num.includes(q) ||
      name.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      plate.includes(q) ||
      model.includes(q) ||
      loc.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2 mb-1">
            FLEET CREW & CHAUFFEURS
          </span>
          <h1 className="font-display text-3xl font-semibold text-white tracking-tight">
            Registered Drivers
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Monitor active chauffeur fleets, trip assignments, ratings, and vehicle readiness
          </p>
        </div>
        <button
          onClick={fetchDrivers}
          className="inline-flex items-center justify-center gap-2 h-[38px] px-4 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-white/10 self-start sm:self-auto transition"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
              placeholder="Search driver ID, name, plate, vehicle..."
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mr-1">
              Service:
            </span>
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
            Showing <span className="text-white font-bold">{filteredDrivers.length}</span> of{" "}
            <span className="text-amber-400 font-bold">{totalCount || drivers.length}</span> total
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Driver ID</th>
                <th className="py-3 px-4">Driver Profile</th>
                <th className="py-3 px-4">Vehicle & Registration</th>
                <th className="py-3 px-4">Service Tier</th>
                <th className="py-3 px-4">Current Hub / Location</th>
                <th className="py-3 px-4">Rating & Trips</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    Loading registered drivers...
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="17" y1="8" x2="23" y2="14"></line>
                        <line x1="23" y1="8" x2="17" y2="14"></line>
                      </svg>
                      <span className="text-sm font-medium text-white/50">No drivers found</span>
                      <span className="text-[11px] text-white/30">There are currently no drivers registered or matching the selected filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d) => {
                  const status = (d.status || "offline").toLowerCase();

                  return (
                    <tr
                      key={d._id}
                      onClick={() => {
                        setSelectedDriver(d);
                        setDriverNotes(d.notes || "");
                      }}
                      className="hover:bg-white/5 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                        {d.driverNumber || d._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{d.name}</div>
                        <div className="text-[11px] text-white/40">{d.phone}</div>
                        {d.email && (
                          <div className="text-[10px] text-white/30 truncate max-w-[140px]">
                            {d.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">
                          {d.vehicleModel || "Vehicle Assigned"}
                        </div>
                        <div className="text-[11px] font-mono text-amber-400/80">
                          {d.vehiclePlate || "Plate Pending"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="capitalize text-white font-medium">
                          {d.service || "All Services"}
                        </div>
                        <div className="text-[11px] text-white/50 capitalize">
                          {d.vehicleType || "Chauffeur Class"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="truncate text-white" title={d.location?.name}>
                          <span
                            className={`font-bold mr-1 ${
                              status === "active"
                                ? "text-emerald-400"
                                : status === "on_trip"
                                ? "text-blue-400"
                                : "text-zinc-500"
                            }`}
                          >
                            ●
                          </span>
                          {d.location?.name || "Greater Sydney Depot"}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {d.licenseNumber ? `Lic: ${d.licenseNumber}` : "NSW Accredited"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-amber-400 font-semibold">
                          <span>★</span>
                          <span>{d.rating ? d.rating.toFixed(2) : "5.00"}</span>
                        </div>
                        <div className="text-[10px] text-white/40">
                          {d.totalTrips || 0} completed rides
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            status === "active"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : status === "on_trip"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : status === "suspended"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30"
                          }`}
                        >
                          {status === "on_trip" ? "On Trip" : status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDriver(d);
                            setDriverNotes(d.notes || "");
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

      {/* Driver Details & Status Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0e121d]/95 backdrop-blur-2xl shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2 mb-1">
                  DRIVER DOSSIER
                </span>
                <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                  Driver:{" "}
                  <span className="text-amber-400 font-mono">
                    {selectedDriver.driverNumber || selectedDriver._id}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6 space-y-6 text-xs">
              {/* Driver Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <span className="text-white/40 block mb-1">Full Name</span>
                  <strong className="text-white text-sm">{selectedDriver.name}</strong>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Phone Number</span>
                  <a
                    href={`tel:${selectedDriver.phone}`}
                    className="text-amber-400 hover:underline text-sm font-semibold"
                  >
                    {selectedDriver.phone}
                  </a>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Email</span>
                  <span className="text-white/80">{selectedDriver.email || "N/A"}</span>
                </div>
              </div>

              {/* Vehicle & Accreditation */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="text-white/40 font-semibold uppercase tracking-wider text-[10px]">
                  Assigned Vehicle & Registration
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-white/40 block mb-1">Model</span>
                    <div className="text-white font-medium text-sm">
                      {selectedDriver.vehicleModel || "Unassigned"}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 block mb-1">License Plate</span>
                    <div className="font-mono text-amber-400 font-semibold text-sm">
                      {selectedDriver.vehiclePlate || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 block mb-1">Driver License</span>
                    <div className="text-white font-medium text-sm">
                      {selectedDriver.licenseNumber || "NSW-Pending"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fleet Tier, Location & Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <span className="text-white/40 block mb-1">Service Tier</span>
                  <span className="text-white font-semibold capitalize">
                    {selectedDriver.service || "Chauffeur"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Rating</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    ★ {selectedDriver.rating ? selectedDriver.rating.toFixed(2) : "5.00"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Completed Trips</span>
                  <span className="text-white font-semibold font-mono">
                    {selectedDriver.totalTrips || 0} Trips
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block mb-1">Current Status</span>
                  <span className="text-amber-400 font-bold capitalize">
                    {selectedDriver.status}
                  </span>
                </div>
              </div>

              {/* Dispatch Action & Notes */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">
                    Fleet Dispatch Notes / Accreditation Remarks:
                  </label>
                  <textarea
                    value={driverNotes}
                    onChange={(e) => setDriverNotes(e.target.value)}
                    placeholder="Enter dispatch notes, license verification notes, or driver shift details..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Status Update Controls */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                <div className="text-white/60 font-semibold uppercase tracking-wider text-[10px]">
                  Driver Operational State
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("active")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition disabled:opacity-50"
                  >
                    Set Available / Active
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("on_trip")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition disabled:opacity-50"
                  >
                    Assign to Live Trip
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("offline")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-zinc-500/20 text-zinc-300 border border-zinc-500/40 hover:bg-zinc-500/30 transition disabled:opacity-50"
                  >
                    Set Offline / Off-Duty
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("suspended")}
                    className="px-3 py-1.5 rounded-lg font-medium text-xs bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition disabled:opacity-50"
                  >
                    Suspend Driver
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-[11px] text-white/40">
                Driver record synced with Sydney Dispatch Control
              </span>
              <button
                onClick={() => setSelectedDriver(null)}
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
