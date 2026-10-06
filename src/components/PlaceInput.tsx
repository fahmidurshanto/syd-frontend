"use client";

import { useEffect, useId, useRef, useState } from "react";
import { api, type Place } from "@/lib/api";
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
};

const TYPE_ICON: Record<string, keyof typeof Icon> = { airport: "plane", hotel: "crown", station: "route", landmark: "star", area: "pin" };

/** Place autocomplete: every place returns coordinates; free text is never accepted (spec §6). */
export function PlaceInput({ id, label, placeholder, value, onChange, icon = "pin", filterType, error, allowLocate }: Props) {
  const [q, setQ] = useState(value?.name ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(value?.name ?? ""), [value]);

  useEffect(() => {
    if (!open || q.length < 2 || q === value?.name) return;
    const t = setTimeout(async () => {
      try {
        const r = await api<{ places: Place[] }>(`/places/search?q=${encodeURIComponent(q)}`);
        setResults(filterType ? r.places.filter((p) => p.type === filterType) : r.places);
        setActive(0);
      } catch {
        setResults([]);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open, filterType, value?.name]);

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
    <div className="field" ref={wrap}>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        className="input"
        placeholder={placeholder}
        value={q}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-invalid={!!error}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && open) { e.preventDefault(); pick(results[active]); }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <I className="input-icon" />
      {allowLocate && !value && (
        <button type="button" onClick={locate} className="absolute right-2 bottom-2.5 grid h-9 w-9 place-items-center rounded-lg" style={{ color: "var(--gold-400)" }} aria-label="Use my location">
          <Icon.locate />
        </button>
      )}
      {error && <span className="error-text">{error}</span>}
      {open && results.length > 0 && (
        <ul id={listId} className="dropdown glass" role="listbox">
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
