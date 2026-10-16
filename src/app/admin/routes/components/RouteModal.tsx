import type { PlaceRoute } from "@/lib/api";
import { VehicleFareConfig } from "./VehicleFareConfig";

interface RouteModalProps {
  route: Partial<PlaceRoute>;
  isSaving: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChange: (updated: Partial<PlaceRoute>) => void;
  onToggleVehicle: (slug: string) => void;
  onVehicleFareChange: (slug: string, amount: number) => void;
  onVehiclePaxSurchargeChange: (slug: string, amount: number) => void;
}

export function RouteModal({
  route,
  isSaving,
  onClose,
  onSave,
  onChange,
  onToggleVehicle,
  onVehicleFareChange,
  onVehiclePaxSurchargeChange,
}: RouteModalProps) {
  const vFares = (route.vehicleAndFares || route.vehicleFares || {}) as Record<string, number>;
  const vPaxSurcharges =
    typeof route.increaseFarePerPerson === "object" && route.increaseFarePerPerson !== null
      ? (route.increaseFarePerPerson as Record<string, number>)
      : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="max-w-2xl w-full my-8 p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0e121d]/98 backdrop-blur-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2 mb-1">
              {route._id ? "UPDATE ROUTE" : "NEW ROUTE"}
            </span>
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
              {route._id ? "Edit Route & Vehicle Fares" : "Add Fixed Route Fare"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 font-semibold mb-1">Origin (First Place) *</label>
              <input
                type="text"
                required
                value={route.firstPlace || ""}
                onChange={(e) => onChange({ ...route, firstPlace: e.target.value })}
                placeholder="e.g. Sydney Airport T1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-white/70 font-semibold mb-1">Destination (Last Place) *</label>
              <input
                type="text"
                required
                value={route.lastPlace || ""}
                onChange={(e) => onChange({ ...route, lastPlace: e.target.value })}
                placeholder="e.g. Sydney CBD / Bondi Beach"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/70 font-semibold mb-1">Currency</label>
              <input
                type="text"
                value={route.currency || "AUD"}
                onChange={(e) => onChange({ ...route, currency: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>
            <div>
              <label className="block text-white/70 font-semibold mb-1">Est. Distance (km)</label>
              <input
                type="number"
                value={route.distanceKm || 0}
                onChange={(e) => onChange({ ...route, distanceKm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-white/70 font-semibold mb-1">Est. Duration (mins)</label>
              <input
                type="number"
                value={route.durationMin || 0}
                onChange={(e) => onChange({ ...route, durationMin: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Multiple Vehicle Category Selection & Per-Vehicle Fares */}
          <VehicleFareConfig
            vehicleAndFares={vFares}
            increaseFarePerPerson={vPaxSurcharges}
            onToggleVehicle={onToggleVehicle}
            onVehicleFareChange={onVehicleFareChange}
            onVehiclePaxSurchargeChange={onVehiclePaxSurchargeChange}
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={route.isActive !== false}
                onChange={(e) => onChange({ ...route, isActive: e.target.checked })}
                className="rounded bg-white/10 border-white/20 text-amber-400 focus:ring-0"
              />
              <span>Active for public online quoting and booking</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-[38px] px-4 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center h-[38px] px-5 rounded-full text-xs font-semibold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-md transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Route Fare"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
