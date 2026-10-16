import type { PlaceRoute } from "@/lib/api";

interface RoutesTableProps {
  routes: PlaceRoute[];
  loading: boolean;
  onEdit: (route: PlaceRoute) => void;
  onDelete: (id?: string) => void;
  onToggleActive: (route: PlaceRoute) => void;
}

export function RoutesTable({
  routes,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: RoutesTableProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">From (Origin)</th>
              <th className="py-3 px-4">To (Destination)</th>
              <th className="py-3 px-4">Base Fare</th>
              <th className="py-3 px-4">Vehicles & Pricing</th>
              <th className="py-3 px-4">Distance & Time</th>
              <th className="py-3 px-4">Per Pax Surcharge</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-white/40">
                  Loading routes catalog...
                </td>
              </tr>
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-white/40">
                  No routes found. Click "+ Add New Route" to create one.
                </td>
              </tr>
            ) : (
              routes.map((r) => {
                const vFares = (r.vehicleAndFares || r.vehicleFares || {}) as Record<string, number>;
                const types = Object.keys(vFares);
                const fareValues = Object.values(vFares);
                const lowestFare = fareValues.length > 0 ? Math.min(...fareValues) : (r.fare ?? r.fair ?? 0);

                const rawSurcharge = r.increaseFarePerPerson ?? r.increaseFairPerPerson;
                const surchargeText =
                  typeof rawSurcharge === "object" && rawSurcharge !== null
                    ? `From +$${Math.min(...(Object.values(rawSurcharge).length > 0 ? Object.values(rawSurcharge) : [0]))}`
                    : `+$${rawSurcharge || 0}`;

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
                    <td className="py-3.5 px-4 font-bold text-amber-400 text-sm whitespace-nowrap">
                      From ${lowestFare}{" "}
                      <span className="text-[10px] text-white/40 font-normal">{r.currency || "AUD"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {types.map((v) => {
                          const specFare = vFares[v];
                          return (
                            <span
                              key={v}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/80"
                            >
                              <span className="capitalize">{v}</span>
                              {specFare !== undefined && (
                                <span className="text-amber-400 font-semibold font-mono">${specFare}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-white/70 whitespace-nowrap">
                      {r.distanceKm ? `${r.distanceKm} km` : "—"} / {r.durationMin ? `${r.durationMin} min` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-white/60 whitespace-nowrap">
                      {surchargeText} / pax
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onToggleActive(r)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/10 text-white/40 border border-white/10"
                        }`}
                      >
                        {isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => onEdit(r)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(r._id)}
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
  );
}
