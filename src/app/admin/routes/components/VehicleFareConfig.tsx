import { VEHICLE_OPTIONS } from "./route-constants";

interface VehicleFareConfigProps {
  vehicleAndFares: Record<string, number>;
  increaseFarePerPerson: Record<string, number>;
  onToggleVehicle: (slug: string) => void;
  onVehicleFareChange: (slug: string, amount: number) => void;
  onVehiclePaxSurchargeChange: (slug: string, amount: number) => void;
}

export function VehicleFareConfig({
  vehicleAndFares,
  increaseFarePerPerson,
  onToggleVehicle,
  onVehicleFareChange,
  onVehiclePaxSurchargeChange,
}: VehicleFareConfigProps) {
  const selectedOptions = VEHICLE_OPTIONS.filter((v) => vehicleAndFares[v.slug] !== undefined);

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-white font-semibold">
          Supported Vehicle Types & Specific Fares
        </label>
        <span className="text-[11px] text-white/40">Select multiple categories</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {VEHICLE_OPTIONS.map((v) => {
          const isSelected = vehicleAndFares[v.slug] !== undefined;

          return (
            <button
              key={v.slug}
              type="button"
              onClick={() => onToggleVehicle(v.slug)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-left border transition ${
                isSelected
                  ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="truncate capitalize">{v.label}</span>
              <span className="text-xs font-bold ml-1">{isSelected ? "✓" : "+"}</span>
            </button>
          );
        })}
      </div>

      {/* Per-vehicle individual fare overrides */}
      {selectedOptions.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <span className="text-[11px] text-white/50 block mb-2 font-medium uppercase tracking-wider">
            Vehicle Tariffs & Extra Pax Surcharges (AUD)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedOptions.map((v) => {
              const currentVal = vehicleAndFares[v.slug] ?? 75;
              const paxVal = increaseFarePerPerson[v.slug] ?? 5;

              return (
                <div key={v.slug} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="block text-xs text-amber-300 font-semibold capitalize">
                    {v.label}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/50 mb-0.5">Base Fare ($)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-white/40 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={currentVal}
                          onChange={(e) =>
                            onVehicleFareChange(v.slug, parseFloat(e.target.value) || 0)
                          }
                          className="w-full pl-6 pr-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/50 mb-0.5">+ Per Pax ($)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-white/40 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={paxVal}
                          onChange={(e) =>
                            onVehiclePaxSurchargeChange(v.slug, parseFloat(e.target.value) || 0)
                          }
                          className="w-full pl-6 pr-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white font-medium text-white/90 text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
