import type { PlaceRoute } from "@/lib/api";

interface RoutesHeaderProps {
  totalRoutes: number;
  searchTerm: string;
  isSeeding: boolean;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  onSeed: () => void;
  statusMessage: { type: "success" | "error"; text: string } | null;
}

export function RoutesHeader({
  totalRoutes,
  searchTerm,
  isSeeding,
  onSearchChange,
  onSearchSubmit,
  onAddNew,
  onRefresh,
  onSeed,
  statusMessage,
}: RoutesHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2 mb-1">
            CATALOG & TARIFF
          </span>
          <h1 className="font-display text-3xl font-semibold text-white tracking-tight">
            Fixed Routes & Pricing
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Configure pre-calculated fare rates between Sydney Airport, suburbs, and landmarks with per-vehicle pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSeed}
            disabled={isSeeding}
            className="inline-flex items-center justify-center h-[38px] px-3.5 rounded-full text-xs font-semibold text-amber-400 border border-amber-400/30 bg-amber-400/5 hover:bg-amber-400/10 transition disabled:opacity-50"
          >
            {isSeeding ? "Seeding..." : "Seed Default Routes"}
          </button>
          <button
            onClick={onAddNew}
            className="inline-flex items-center justify-center h-[38px] px-4 rounded-full text-xs font-semibold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-md transition"
          >
            + Add New Route
          </button>
          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center h-[38px] px-4 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/[0.03] hover:bg-white/10 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
              : "bg-red-500/10 text-red-300 border-red-500/20"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={onSearchSubmit} className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by suburb, hotel, or airport..."
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

        <span className="text-xs text-white/50">
          Showing <strong>{totalRoutes}</strong> routes
        </span>
      </div>
    </div>
  );
}
