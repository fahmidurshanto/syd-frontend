export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const BASE = `${API_URL}/api/v1`;

export type Place = { id?: string; name: string; address?: string; lat: number; lng: number; type?: string; code?: string };
export type Service = "taxi" | "airport" | "chauffeur";

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
