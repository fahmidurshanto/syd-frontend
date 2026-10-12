"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchPlacesApi, type Place } from "@/lib/api";
import { Icon } from "./Icon";

type Props = {
  id: string;
  label: string;
  placeholder: string;
  value: Place | null;
  onChange: (p: Place | null) => void;
  icon?: "pin" | "flag" | "plane";
  filterType?: string;
  error?: string;
  allowLocate?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  allowedPlaces?: Place[] | null;
  onDisabledClick?: () => void;
};

const TYPE_ICON: Record<string, keyof typeof Icon> = { airport: "plane", hotel: "crown", station: "route", landmark: "star", area: "pin" };

/** Place autocomplete: every place returns coordinates; free text is never accepted (spec §6). */
export function PlaceInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  icon = "pin",
  filterType,
  error,
  allowLocate,
  disabled = false,
  disabledMessage,
  allowedPlaces,
  onDisabledClick,
}: Props) {
  const [q, setQ] = useState(value?.name ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(value?.name ?? ""), [value]);

  useEffect(() => {
    if (!open || disabled) return;
    const checkPosition = () => {
      if (wrap.current) {
        const rect = wrap.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // Flip upwards if space below is tighter than 300px and more space exists above
        if (spaceBelow < 300 && rect.top > spaceBelow) {
          setOpenUpwards(true);
        } else {
          setOpenUpwards(false);
        }
      }
    };
    checkPosition();
    window.addEventListener("resize", checkPosition);
    window.addEventListener("scroll", checkPosition, true);
    return () => {
      window.removeEventListener("resize", checkPosition);
      window.removeEventListener("scroll", checkPosition, true);
    };
  }, [open, disabled]);

  useEffect(() => {
    if (!open || disabled) return;
    const isInitialOrSelected = !q.trim() || q === value?.name;
    const queryTerm = isInitialOrSelected ? "" : q.trim();

    // If an explicit allowedPlaces restriction list is provided, filter within it exclusively
    if (allowedPlaces !== undefined && allowedPlaces !== null) {
      if (!queryTerm) {
        const filtered = filterType ? allowedPlaces.filter((p) => p.type === filterType) : allowedPlaces;
        setResults(filtered);
      } else {
        const lower = queryTerm.toLowerCase();
        const matches = allowedPlaces.filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.address?.toLowerCase().includes(lower) ||
            p.code?.toLowerCase().includes(lower)
        );
        const filtered = filterType ? matches.filter((p) => p.type === filterType) : matches;
        setResults(filtered);
      }
      setLoading(false);
      setActive(0);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const places = await searchPlacesApi(queryTerm);
        const filtered = filterType ? places.filter((p) => p.type === filterType) : places;
        setResults(filtered);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, queryTerm ? 180 : 0);

    return () => clearTimeout(t);
  }, [q, open, disabled, filterType, value?.name, allowedPlaces]);

  useEffect(() => {
    const close = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (p: Place) => {
    onChange(p);
    setQ(p.name);
    setOpen(false);
  };

  const locate = () =>
    navigator.geolocation?.getCurrentPosition((pos) => pick({ name: "Current location", address: "Your current location", lat: pos.coords.latitude, lng: pos.coords.longitude }));

  const I = Icon[icon];
  return (
    <div
      className={`field ${open && !disabled ? "relative z-50" : "relative z-10"} ${
        disabled ? "opacity-75" : ""
      }`}
      ref={wrap}
      onClick={() => {
        if (disabled && onDisabledClick) {
          onDisabledClick();
        }
      }}
    >
      <label htmlFor={id} className="label flex items-center justify-between">
        <span>{label}</span>
        {disabled && disabledMessage && (
          <span className="text-[10px] text-[var(--gold-400)] tracking-normal normal-case font-normal">
            {disabledMessage}
          </span>
        )}
      </label>
      <input
        id={id}
        disabled={disabled}
        className={`input ${disabled ? "cursor-not-allowed bg-[hsl(224_30%_5%/0.8)] border-[var(--line)] text-zinc-400 placeholder:text-zinc-500" : ""}`}
        placeholder={placeholder}
        value={q}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && results.length > 0 && !disabled}
        aria-controls={listId}
        aria-invalid={!!error}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(e) => {
          if (disabled) return;
          setQ(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onKeyDown={(e) => {
          if (disabled || !results.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && open) { e.preventDefault(); pick(results[active]); }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <I className="input-icon" />
      {allowLocate && !value && !disabled && (
        <button type="button" onClick={locate} className="absolute right-2 bottom-2.5 grid h-9 w-9 place-items-center rounded-lg" style={{ color: "var(--gold-400)" }} aria-label="Use my location">
          <Icon.locate />
        </button>
      )}
      {error && <span className="error-text">{error}</span>}
      {open && !disabled && (
        <ul
          id={listId}
          className={`dropdown border border-[var(--gold-400)] bg-[hsl(224_30%_8%)] shadow-2xl ${
            openUpwards ? "dropdown-up" : ""
          }`}
          role="listbox"
        >
          {allowedPlaces !== undefined && allowedPlaces !== null && (
            <li className="px-3 py-1.5 text-[11px] font-semibold text-[var(--gold-400)] border-b border-[var(--line)] flex items-center justify-between">
              <span>Connected Routes ({results.length})</span>
              <span className="mute font-normal text-[10px]">Active catalog only</span>
            </li>
          )}
          {loading && results.length === 0 && (
            <li className="p-3 text-xs text-[var(--gold-400)] text-center animate-pulse flex items-center justify-center gap-2">
              <Icon.clock width={14} height={14} /> Loading destinations...
            </li>
          )}
          {!loading && results.length === 0 && (
            <li className="p-3 text-xs mute text-center">
              {allowedPlaces !== undefined && allowedPlaces !== null
                ? "No connected routes available for this pickup"
                : `No matching locations found for "${q}"`}
            </li>
          )}
          {results.map((p, i) => {
            const TI = Icon[TYPE_ICON[p.type ?? "area"] ?? "pin"];
            return (
              <li key={p.id ?? p.name} role="option" aria-selected={i === active}>
                <button type="button" data-active={i === active} onMouseEnter={() => setActive(i)} onClick={() => pick(p)}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: "hsl(40 62% 64% / 0.1)", color: "var(--gold-400)" }}><TI width={18} height={18} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="mute block truncate text-xs">{p.address}</span>
                  </span>
                  {p.code && <span className="pill pill-gold ml-auto">{p.code}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
