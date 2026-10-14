"use client";

import { useEffect, useState } from "react";
import {
  getAdminVehiclesApi,
  saveVehicleApi,
  money,
  type VehicleRecord,
} from "@/lib/api";

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await getAdminVehiclesApi();
      setVehicles(data);
    } catch (err) {
      console.error("Failed loading vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    setIsSaving(true);
    const ok = await saveVehicleApi(editingVehicle);
    if (ok) {
      setEditingVehicle(null);
      fetchVehicles();
    } else {
      alert("Failed to update vehicle.");
    }
    setIsSaving(false);
  };

  const handleToggleActive = async (v: VehicleRecord) => {
    const updated = { ...v, isActive: !v.isActive };
    const ok = await saveVehicleApi(updated);
    if (ok) {
      setVehicles((prev) =>
        prev.map((item) => (item._id === v._id ? { ...item, isActive: !v.isActive } : item))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-1">FLEET & CAPACITIES</span>
          <h1 className="display text-3xl font-semibold text-white">Vehicle Classes & Tariffs</h1>
          <p className="mute text-xs mt-1">Configure vehicle models, passenger limits, luggage allowances, and base rates</p>
        </div>
        <button onClick={fetchVehicles} className="btn btn-ghost btn-sm self-start sm:self-auto">
          Refresh Fleet
        </button>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-white/40">
            Loading vehicle fleet...
          </div>
        ) : (
          vehicles.map((v) => {
            const isActive = v.isActive !== false;

            return (
              <div
                key={v._id || v.slug}
                className="glass p-6 rounded-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="eyebrow">{v.group || "Sedan"}</span>
                    <button
                      onClick={() => handleToggleActive(v)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/10 text-white/40 border border-white/10"
                      }`}
                    >
                      {isActive ? "Active" : "Disabled"}
                    </button>
                  </div>

                  <h2 className="display text-xl font-bold text-white mb-1">{v.name}</h2>
                  <p className="text-xs text-white/60 mb-4 line-clamp-2">{v.description}</p>

                  {/* Pricing Matrix */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Base Fare</span>
                      <strong className="text-gold text-sm font-semibold">{money(v.basePrice)}</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Min Fare</span>
                      <strong className="text-white text-sm font-semibold">{money(v.minimumFare)}</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Rate / Km</span>
                      <span className="text-white font-medium">{money(v.pricePerKm)}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Rate / Min</span>
                      <span className="text-white font-medium">{money(v.pricePerMinute)}</span>
                    </div>
                  </div>

                  {/* Capacities */}
                  <div className="flex items-center gap-4 text-xs text-white/70 mb-4">
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span>Max {v.passengersMax} Pax</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      <span>{v.luggage} Bags</span>
                    </div>
                  </div>

                  {/* Example Models */}
                  {v.exampleModels && v.exampleModels.length > 0 && (
                    <div className="text-[11px] text-white/40">
                      Models: {v.exampleModels.join(", ")}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <button
                    onClick={() => setEditingVehicle(v)}
                    className="w-full btn btn-ghost btn-sm justify-center"
                  >
                    Edit Vehicle Rates
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass max-w-xl w-full p-6 sm:p-8 rounded-2xl border border-white/10 relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="eyebrow mb-1">RATES & SPECS</span>
                <h2 className="display text-2xl font-bold text-white">
                  Edit {editingVehicle.name}
                </h2>
              </div>
              <button
                onClick={() => setEditingVehicle(null)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editingVehicle.name}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Category Group</label>
                  <input
                    type="text"
                    value={editingVehicle.group || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, group: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingVehicle.description || ""}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Pricing Inputs (cents converted to AUD for editing) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Base Price ($ AUD)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingVehicle.basePrice / 100}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        basePrice: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-gold font-bold focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Min Fare ($ AUD)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingVehicle.minimumFare / 100}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        minimumFare: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Rate / Km ($ AUD)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingVehicle.pricePerKm / 100}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        pricePerKm: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Rate / Min ($ AUD)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingVehicle.pricePerMinute / 100}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        pricePerMinute: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Max Passengers</label>
                  <input
                    type="number"
                    value={editingVehicle.passengersMax}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        passengersMax: parseInt(e.target.value || "1"),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Luggage Bags</label>
                  <input
                    type="number"
                    value={editingVehicle.luggage}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        luggage: parseInt(e.target.value || "1"),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-white/80">
                  <input
                    type="checkbox"
                    checked={editingVehicle.isActive !== false}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, isActive: e.target.checked })
                    }
                    className="rounded bg-white/10 border-white/20 text-amber-400 focus:ring-0"
                  />
                  <span>Active in online booking selector</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-gold btn-sm"
                >
                  {isSaving ? "Saving..." : "Save Vehicle Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
