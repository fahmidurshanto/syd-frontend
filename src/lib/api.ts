export const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000").replace(/\/+$/, "");
const BASE = `${API_URL}/api/v1`;

export type Place = { id?: string; name: string; address?: string; lat: number; lng: number; type?: string; code?: string };
export type Service = "taxi" | "airport" | "chauffeur";

export type PlaceRoute = {
  _id?: string;
  firstPlace: string;
  lastPlace: string;
  fair?: number;
  fare?: number;
  increaseFairPerPerson?: number;
  increaseFarePerPerson?: number;
  currency?: string;
  distanceKm?: number;
  durationMin?: number;
  vehicleType?: string;
  notes?: string;
  firstPlaceDetails?: { address?: string; lat?: number; lng?: number; code?: string };
  lastPlaceDetails?: { address?: string; lat?: number; lng?: number; code?: string };
  isActive?: boolean;
};

export function normalizePlace(raw: any): Place {
  if (!raw) return { name: "", lat: -33.8688, lng: 151.2093 };
  const name = typeof raw === "string" ? raw : (raw.name || raw.firstPlace || raw.lastPlace || "");
  const code = typeof raw === "object" ? raw.code : undefined;
  const address = typeof raw === "object" && raw.address ? raw.address : (code ? `${code} Area, Sydney NSW` : "Greater Sydney, NSW");
  let type = typeof raw === "object" ? raw.type : undefined;
  if (!type) {
    if (code === "SYD" || /airport/i.test(name)) type = "airport";
    else if (code === "CBD" || /cbd/i.test(name)) type = "area";
    else if (/beach/i.test(name)) type = "landmark";
    else if (/hotel/i.test(name)) type = "hotel";
    else if (/station/i.test(name)) type = "station";
    else type = "area";
  }
  return {
    id: typeof raw === "object" ? (raw._id || raw.id || name) : name,
    name,
    address,
    lat: typeof raw === "object" && typeof raw.lat === "number" ? raw.lat : -33.8688,
    lng: typeof raw === "object" && typeof raw.lng === "number" ? raw.lng : 151.2093,
    type,
    code,
  };
}

/** Fetches autocomplete place suggestions using GET /api/v1/places/search or /places/all */
export async function searchPlacesApi(q?: string): Promise<Place[]> {
  try {
    const trimmed = q?.trim();
    const endpoint = trimmed
      ? `/places/search?q=${encodeURIComponent(trimmed)}&details=true`
      : `/places/all?details=true`;
    const res = await api<{ success?: boolean; places: any[] }>(endpoint);
    if (Array.isArray(res.places)) {
      return res.places.map(normalizePlace);
    }
    return [];
  } catch {
    return [];
  }
}

/** Fetches available connected destination places for a selected pickup place from the server */
export async function getConnectedPlacesApi(origin: string): Promise<Place[]> {
  if (!origin?.trim()) return [];
  const cleanOrigin = origin.trim();

  try {
    const res = await api<{ success?: boolean; places: any[] }>(
      `/places/destinations?from=${encodeURIComponent(cleanOrigin)}`
    );
    if (Array.isArray(res.places) && res.places.length > 0) {
      return res.places.map(normalizePlace);
    }
  } catch {
    // Fallback to route search below
  }

  try {
    const res = await api<{ success?: boolean; places: PlaceRoute[] }>(
      `/places?search=${encodeURIComponent(cleanOrigin)}&limit=100&isActive=true`
    );
    if (Array.isArray(res.places)) {
      const destMap = new Map<string, Place>();
      const lowerOrigin = cleanOrigin.toLowerCase();

      for (const r of res.places) {
        const firstMatch = r.firstPlace?.toLowerCase().includes(lowerOrigin);
        const lastMatch = r.lastPlace?.toLowerCase().includes(lowerOrigin);

        if (firstMatch && r.lastPlace) {
          const lower = r.lastPlace.toLowerCase();
          if (!destMap.has(lower)) {
            destMap.set(
              lower,
              normalizePlace({
                name: r.lastPlace,
                address: r.lastPlaceDetails?.address,
                lat: r.lastPlaceDetails?.lat,
                lng: r.lastPlaceDetails?.lng,
                code: r.lastPlaceDetails?.code,
              })
            );
          }
        }

        if (lastMatch && r.firstPlace) {
          const lower = r.firstPlace.toLowerCase();
          if (!destMap.has(lower)) {
            destMap.set(
              lower,
              normalizePlace({
                name: r.firstPlace,
                address: r.firstPlaceDetails?.address,
                lat: r.firstPlaceDetails?.lat,
                lng: r.firstPlaceDetails?.lng,
                code: r.firstPlaceDetails?.code,
              })
            );
          }
        }
      }
      return Array.from(destMap.values());
    }
  } catch {
    // fallback empty
  }

  return [];
}

/** Looks up route fare and distance/duration using GET /api/v1/places/lookup */
export async function lookupRouteFareApi(from: string, to: string): Promise<PlaceRoute | null> {
  if (!from?.trim() || !to?.trim()) return null;
  try {
    const res = await api<{ success: boolean; place: PlaceRoute }>(
      `/places/lookup?from=${encodeURIComponent(from.trim())}&to=${encodeURIComponent(to.trim())}`
    );
    return res.place ?? null;
  } catch {
    return null;
  }
}

/** Retrieves route fare catalog from GET /api/v1/places */
export async function getPopularRoutesApi(limit = 6): Promise<PlaceRoute[]> {
  try {
    const res = await api<{ success: boolean; places: PlaceRoute[] }>(
      `/places?limit=${limit}&isActive=true`
    );
    return res.places ?? [];
  } catch {
    return [];
  }
}

export type VehicleCategory = {
  slug: string;
  name: string;
  description?: string;
  group?: string;
  passengersMin?: number;
  passengersMax: number;
  luggage: number;
  features?: string[];
  exampleModels?: string[];
  image?: string;
  priceFrom?: number | null;
};

export type PriceSnapshot = {
  currency: string;
  lines: { label: string; amount: number }[];
  total: number;
  gstIncluded: number;
  distanceKm: number;
  durationMin: number;
};

export type QuoteOption = { category: VehicleCategory; price: PriceSnapshot; etaMin: number | null; quoteToken: string };

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string[]>) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    method: init.method ?? (init.json ? "POST" : "GET"),
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    body: init.json ? JSON.stringify(init.json) : init.body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong", res.status, data.fields);
  return data as T;
}

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
export const money = (cents: number | null | undefined) => (cents == null ? "—" : aud.format(cents / 100));

export const sydneyTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export const SERVICE_LABEL: Record<Service, string> = { taxi: "Taxi", airport: "Airport Transfer", chauffeur: "Chauffeur" };
