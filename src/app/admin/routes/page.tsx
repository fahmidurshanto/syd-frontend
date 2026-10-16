"use client";

import { useEffect, useState } from "react";
import {
  getAdminPlacesApi,
  savePlaceRouteApi,
  deletePlaceRouteApi,
  type PlaceRoute,
} from "@/lib/api";

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<PlaceRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRoute, setEditingRoute] = useState<Partial<PlaceRoute> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const data = await getAdminPlacesApi(searchTerm.trim() || undefined, 150);
      setPlaces(data);
    } catch (err) {
      console.error("Failed loading routes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlaces();
  };

  const handleOpenAddModal = () => {
    setEditingRoute({
      firstPlace: "Sydney Airport T1",
      lastPlace: "",
      fair: 75,
      increaseFairPerPerson: 5,
      currency: "AUD",
      distanceKm: 15,
      durationMin: 25,
      vehicleType: "taxi",
      isActive: true,
      firstPlaceDetails: {
        address: "Airport Dr, Mascot NSW 2020",
        code: "SYD",
      },
      lastPlaceDetails: {
        address: "",
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute || !editingRoute.firstPlace || !editingRoute.lastPlace) {
      alert("Origin and Destination are required");
      return;
    }

    setIsSaving(true);
    const ok = await savePlaceRouteApi(editingRoute);
    if (ok) {
      setEditingRoute(null);
      fetchPlaces();
    } else {
      alert("Failed to save route. Check backend connectivity.");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this route fare?")) return;
    const ok = await deletePlaceRouteApi(id);
    if (ok) {
      fetchPlaces();
    } else {
      alert("Failed to delete route.");
    }
  };

  const handleToggleActive = async (route: PlaceRoute) => {
    const updated = { ...route, isActive: !route.isActive };
    const ok = await savePlaceRouteApi(updated);
    if (ok) {
      setPlaces((prev) =>
        prev.map((r) => (r._id === route._id ? { ...r, isActive: !route.isActive } : r))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-1">CATALOG & TARIFF</span>
          <h1 className="display text-3xl font-semibold text-white">Fixed Routes & Pricing</h1>
          <p className="mute text-xs mt-1">Configure pre-calculated fare rates between Sydney Airport, suburbs, and landmarks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleOpenAddModal} className="btn btn-gold btn-sm">
            + Add New Route
          </button>
          <button onClick={fetchPlaces} className="btn btn-ghost btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by suburb, hotel, or airport..."
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

        <span className="text-xs text-white/50">
          Showing <strong>{places.length}</strong> routes
        </span>
      </div>

      {/* Routes Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">From (Origin)</th>
                <th className="py-3 px-4">To (Destination)</th>
                <th className="py-3 px-4">Fixed Fare</th>
                <th className="py-3 px-4">Distance & Time</th>
                <th className="py-3 px-4">Per Pax Surcharge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    Loading routes catalog...
                  </td>
                </tr>
              ) : places.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    No routes found. Click "+ Add New Route" to create one.
                  </td>
                </tr>
              ) : (
                places.map((r) => {
                  const fareVal = r.fair ?? r.fare ?? 0;
                  const surcharge = r.increaseFairPerPerson ?? r.increaseFarePerPerson ?? 0;
                  const isActive = r.isActive !== false;

                  return (
                    <tr key={r._id || `${r.firstPlace}-${r.lastPlace}`} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {r.firstPlace}
                        {r.firstPlaceDetails?.code && (
                          <span className="ml-1 text-[10px] text-amber-400 font-mono">
                            [{r.firstPlaceDetails.code}]
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {r.lastPlace}
                        {r.lastPlaceDetails?.code && (
                          <span className="ml-1 text-[10px] text-amber-400 font-mono">
                            [{r.lastPlaceDetails.code}]
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gold text-sm">
                        ${fareVal} <span className="text-[10px] text-white/40 font-normal">AUD</span>
                      </td>
                      <td className="py-3.5 px-4 text-white/70">
                        {r.distanceKm ? `${r.distanceKm} km` : "—"} / {r.durationMin ? `${r.durationMin} min` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-white/60">
                        +${surcharge} / pax
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(r)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition ${
                            isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-white/10 text-white/40 border border-white/10"
                          }`}
                        >
                          {isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingRoute(r)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20"
                        >
                          Delete
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

      {/* Add / Edit Route Modal */}
      {editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass max-w-xl w-full p-6 sm:p-8 rounded-2xl border border-white/10 relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="eyebrow mb-1">{editingRoute._id ? "UPDATE ROUTE" : "NEW ROUTE"}</span>
                <h2 className="display text-2xl font-bold text-white">
                  {editingRoute._id ? "Edit Route & Fare" : "Add Fixed Route Fare"}
                </h2>
              </div>
              <button
                onClick={() => setEditingRoute(null)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Origin (First Place) *</label>
                  <input
                    type="text"
                    required
                    value={editingRoute.firstPlace || ""}
                    onChange={(e) => setEditingRoute({ ...editingRoute, firstPlace: e.target.value })}
                    placeholder="e.g. Sydney Airport T1"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Destination (Last Place) *</label>
                  <input
                    type="text"
                    required
                    value={editingRoute.lastPlace || ""}
                    onChange={(e) => setEditingRoute({ ...editingRoute, lastPlace: e.target.value })}
                    placeholder="e.g. Sydney CBD / Bondi Beach"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Fixed Fare ($ AUD) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={editingRoute.fair ?? editingRoute.fare ?? 0}
                    onChange={(e) =>
                      setEditingRoute({
                        ...editingRoute,
                        fair: parseFloat(e.target.value) || 0,
                        fare: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-gold focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Extra Per Pax ($ AUD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingRoute.increaseFairPerPerson ?? editingRoute.increaseFarePerPerson ?? 0}
                    onChange={(e) =>
                      setEditingRoute({
                        ...editingRoute,
                        increaseFairPerPerson: parseFloat(e.target.value) || 0,
                        increaseFarePerPerson: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Vehicle Category</label>
                  <select
                    value={editingRoute.vehicleType || "taxi"}
                    onChange={(e) => setEditingRoute({ ...editingRoute, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  >
                    <option value="taxi" className="bg-[#111]">Taxi</option>
                    <option value="executive" className="bg-[#111]">Executive Sedan</option>
                    <option value="luxury" className="bg-[#111]">Luxury Chauffeur</option>
                    <option value="suv" className="bg-[#111]">Premium SUV</option>
                    <option value="mpv" className="bg-[#111]">Luxury MPV</option>
                    <option value="van" className="bg-[#111]">Minibus / Van</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Est. Distance (km)</label>
                  <input
                    type="number"
                    value={editingRoute.distanceKm || 0}
                    onChange={(e) => setEditingRoute({ ...editingRoute, distanceKm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Est. Duration (mins)</label>
                  <input
                    type="number"
                    value={editingRoute.durationMin || 0}
                    onChange={(e) => setEditingRoute({ ...editingRoute, durationMin: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-white/80">
                  <input
                    type="checkbox"
                    checked={editingRoute.isActive !== false}
                    onChange={(e) => setEditingRoute({ ...editingRoute, isActive: e.target.checked })}
                    className="rounded bg-white/10 border-white/20 text-amber-400 focus:ring-0"
                  />
                  <span>Active for public online quoting and booking</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-gold btn-sm"
                >
                  {isSaving ? "Saving..." : "Save Route Fare"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
