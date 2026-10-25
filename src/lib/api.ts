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
  increaseFairPerPerson?: number | Record<string, number>;
  increaseFarePerPerson?: number | Record<string, number>;
  currency?: string;
  distanceKm?: number;
  durationMin?: number;
  vehicleType?: string[] | string;
  vehicleFares?: Record<string, number>;
  vehicleAndFares?: Record<string, number>;
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

/** Fetches autocomplete place suggestions using GET /api/v1/routes/search or /routes/all */
export async function searchPlacesApi(q?: string): Promise<Place[]> {
  try {
    const trimmed = q?.trim();
    const endpoint = trimmed
      ? `/routes/search?q=${encodeURIComponent(trimmed)}&details=true`
      : `/routes/all?details=true`;
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
      `/routes/destinations?from=${encodeURIComponent(cleanOrigin)}`
    );
    if (Array.isArray(res.places) && res.places.length > 0) {
      return res.places.map(normalizePlace);
    }
  } catch {
    // Fallback to route search below
  }

  try {
    const res = await api<{ success?: boolean; routes?: PlaceRoute[]; places?: PlaceRoute[] }>(
      `/routes?search=${encodeURIComponent(cleanOrigin)}&limit=100&isActive=true`
    );
    const routeList = res.routes ?? res.places;
    if (Array.isArray(routeList)) {
      const destMap = new Map<string, Place>();
      const lowerOrigin = cleanOrigin.toLowerCase();

      for (const r of routeList) {
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

/** Looks up route fare and distance/duration using GET /api/v1/routes/lookup */
export async function lookupRouteFareApi(from: string, to: string): Promise<PlaceRoute | null> {
  if (!from?.trim() || !to?.trim()) return null;
  try {
    const res = await api<{ success: boolean; route?: PlaceRoute; place?: PlaceRoute }>(
      `/routes/lookup?from=${encodeURIComponent(from.trim())}&to=${encodeURIComponent(to.trim())}`
    );
    return res.route ?? res.place ?? null;
  } catch {
    return null;
  }
}

/** Retrieves route fare catalog from GET /api/v1/routes */
export async function getPopularRoutesApi(limit = 6): Promise<PlaceRoute[]> {
  try {
    const res = await api<{ success: boolean; routes?: PlaceRoute[]; places?: PlaceRoute[] }>(
      `/routes?limit=${limit}&isActive=true`
    );
    return res.routes ?? res.places ?? [];
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

let isRefreshing = false;
let refreshSubscribers: Array<(ok: boolean) => void> = [];

function onRefreshed(ok: boolean) {
  refreshSubscribers.forEach((cb) => cb(ok));
  refreshSubscribers = [];
}

export async function adminRefreshTokenApi(): Promise<{
  success: boolean;
  admin?: AdminUser;
  accessToken?: string;
  refreshToken?: string;
}> {
  const res = await fetch(`${BASE}/admins/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || "Failed to refresh token", res.status);
  }
  return data;
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown; _retry?: boolean } = {}): Promise<T> {
  const isPublicAuth =
    path.includes("/login") ||
    path.includes("/register") ||
    path.includes("/send-otp") ||
    path.includes("/verify-otp") ||
    path.includes("/seed");

  const token = !isPublicAuth && typeof document !== "undefined"
    ? (path.startsWith("/drivers") ? getDriverToken() : path.startsWith("/passengers") ? getPassengerToken() : getDriverToken() || getPassengerToken())
    : null;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
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

  // If 401 Unauthorized occurs on an ADMIN authenticated request and we haven't already retried
  if (
    res.status === 401 &&
    !init._retry &&
    path.startsWith("/admins") &&
    !path.includes("/admins/login") &&
    !path.includes("/admins/refresh-token")
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        await adminRefreshTokenApi();
        isRefreshing = false;
        onRefreshed(true);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(false);
        throw refreshErr;
      }
    } else {
      // Queue up any parallel requests while refresh is in flight
      const refreshSuccess = await new Promise<boolean>((resolve) => {
        refreshSubscribers.push(resolve);
      });
      if (!refreshSuccess) {
        throw new ApiError("Session expired", 401);
      }
    }

    // Retry original request with new rotated cookie
    return api<T>(path, { ...init, _retry: true });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : (data.message ?? data.error ?? "Something went wrong");
    throw new ApiError(errorMsg, res.status, data.fields);
  }
  return data as T;
}

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
export const money = (cents: number | null | undefined) => (cents == null ? "—" : aud.format(cents / 100));

export const sydneyTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export const SERVICE_LABEL: Record<Service, string> = { taxi: "Taxi Service", airport: "Airport Transfer", chauffeur: "Limousine Service" };

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "CANCELLED"
  | "CONFIRMED"
  | "PENDING";

export type BookingRecord = {
  _id: string;
  bookingNumber?: string;
  service: Service;
  status: BookingStatus;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  passenger?: { name?: string; phone?: string; email?: string };
  pickup?: Place;
  pickupLocation?: { address?: string; coordinates?: [number, number] };
  destination?: Place;
  dropoffLocation?: { address?: string; coordinates?: [number, number] };
  vehicleType?: string;
  vehicleDetails?: { name?: string; slug?: string; luggage?: number; exampleModels?: string[]; image?: string };
  vehicle?: VehicleRecord;
  passengers?: number;
  flightNumber?: string;
  airportTripType?: "pickup" | "dropoff" | null;
  fare?: {
    total?: number;
    currency?: string;
    distanceKm?: number;
    durationMin?: number;
    gstIncluded?: number;
    lines?: { label: string; amount: number }[];
  };
  notes?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type VehicleRecord = {
  _id: string;
  slug: string;
  name: string;
  group?: string;
  description?: string;
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  passengersMin: number;
  passengersMax: number;
  luggage: number;
  features?: string[];
  exampleModels?: string[];
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  supportedServices?: string[];
};

// Admin Bookings API - Synced with NestJS BookingsController
export async function getAdminBookingsApi(params?: {
  phone?: string;
  status?: string;
  service?: string;
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<{ total: number; bookings: BookingRecord[] }> {
  try {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.service && params.service !== "all") qs.set("service", params.service);
    if (params?.phone) qs.set("phone", params.phone);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.skip) qs.set("skip", String(params.skip));

    const endpoint = `/bookings${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await api<{ success: boolean; total?: number; bookings?: BookingRecord[]; data?: BookingRecord[] }>(endpoint);

    const list: BookingRecord[] = Array.isArray(res.bookings)
      ? res.bookings
      : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res)
      ? (res as unknown as BookingRecord[])
      : [];

    return {
      total: typeof res.total === "number" ? res.total : list.length,
      bookings: list,
    };
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    return { total: 0, bookings: [] };
  }
}

export async function getBookingByIdOrRefApi(refOrId: string): Promise<BookingRecord | null> {
  try {
    const res = await api<{ success: boolean; booking: BookingRecord }>(`/bookings/${encodeURIComponent(refOrId)}`);
    return res.booking ?? null;
  } catch (err) {
    console.error(`Failed to fetch booking ${refOrId}:`, err);
    return null;
  }
}

export async function updateBookingStatusApi(
  refOrId: string,
  dto: { status?: string; paymentStatus?: string; notes?: string; cancellationReason?: string }
): Promise<{ ok: boolean; booking?: BookingRecord; error?: string }> {
  try {
    const res = await api<{ success: boolean; message?: string; booking?: BookingRecord }>(
      `/bookings/${encodeURIComponent(refOrId)}/status`,
      {
        method: "PATCH",
        json: dto,
      }
    );
    return { ok: true, booking: res.booking };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update booking status";
    return { ok: false, error: msg };
  }
}

export async function cancelBookingApi(
  refOrId: string,
  reason?: string
): Promise<{ ok: boolean; booking?: BookingRecord; error?: string }> {
  try {
    const res = await api<{ success: boolean; message?: string; booking?: BookingRecord }>(
      `/bookings/${encodeURIComponent(refOrId)}/cancel`,
      {
        method: "POST",
        json: reason ? { reason } : {},
      }
    );
    return { ok: true, booking: res.booking };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to cancel booking";
    return { ok: false, error: msg };
  }
}

export async function deleteBookingApi(id: string): Promise<boolean> {
  // Gracefully fallback to cancel on the server as NestJS BookingsController handles cancel/status updates
  const res = await cancelBookingApi(id, "Cancelled by dispatch administrator");
  return res.ok;
}

// Admin Places / Routes API
export async function getAdminPlacesApi(search?: string, limit = 100): Promise<PlaceRoute[]> {
  try {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    qs.set("limit", String(limit));
    const res = await api<{ routes?: PlaceRoute[]; places?: PlaceRoute[] }>(`/routes?${qs.toString()}`);
    return res.routes ?? res.places ?? [];
  } catch {
    return [];
  }
}

export async function savePlaceRouteApi(route: Partial<PlaceRoute>): Promise<{ success: boolean; error?: string }> {
  try {
    if (route._id) {
      await api(`/routes/${route._id}`, {
        method: "PATCH",
        json: route,
      });
    } else {
      await api("/routes", {
        method: "POST",
        json: route,
      });
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed saving place route:", err);
    return { success: false, error: err?.message || "Failed to save route" };
  }
}

export async function deletePlaceRouteApi(id: string): Promise<boolean> {
  try {
    await api(`/routes/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

export async function seedDefaultRoutesApi(): Promise<{ success: boolean; error?: string }> {
  try {
    await api("/routes/seed", { method: "POST" });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to seed default routes" };
  }
}

// Admin Vehicles API
export async function getAdminVehiclesApi(): Promise<VehicleRecord[]> {
  try {
    const res = await api<{ vehicles: VehicleRecord[] }>("/vehicles");
    return res.vehicles ?? [];
  } catch {
    return [];
  }
}

export async function saveVehicleApi(vehicle: Partial<VehicleRecord>): Promise<boolean> {
  try {
    if (vehicle._id) {
      await api(`/vehicles/${vehicle._id}`, {
        method: "PATCH",
        json: vehicle,
      });
    } else {
      await api("/vehicles", {
        method: "POST",
        json: vehicle,
      });
    }
    return true;
  } catch (err) {
    console.error("Failed saving vehicle:", err);
    return false;
  }
}

// Admin Authentication Types & API
export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | string;
  phone?: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function adminLoginApi(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; admin: AdminUser; accessToken?: string }> {
  return api<{ success: boolean; message: string; admin: AdminUser; accessToken?: string }>(
    "/admins/login",
    {
      method: "POST",
      json: { email, password },
    }
  );
}

export async function adminLogoutApi(): Promise<{ success: boolean; message?: string }> {
  try {
    return await api<{ success: boolean; message?: string }>("/admins/logout", {
      method: "POST",
    });
  } catch {
    return { success: true };
  }
}

export async function getAdminMeApi(): Promise<{ success: boolean; admin: AdminUser }> {
  return api<{ success: boolean; admin: AdminUser }>("/admins/me");
}

export type DriverRecord = {
  _id: string;
  driverNumber?: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleType?: "taxi" | "airport" | "chauffeur" | "executive" | "suv" | "van" | string;
  service?: "taxi" | "airport" | "chauffeur" | "all" | string;
  status: "active" | "on_trip" | "offline" | "suspended" | string;
  rating?: number;
  totalTrips?: number;
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminDriversApi(params?: {
  status?: string;
  service?: string;
  search?: string;
  limit?: number;
}): Promise<{ total: number; drivers: DriverRecord[] }> {
  try {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.service && params.service !== "all") qs.set("service", params.service);
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));

    const endpoint = `/admins/drivers${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await api<{ success: boolean; total?: number; drivers?: DriverRecord[]; data?: DriverRecord[] }>(endpoint);

    const list: DriverRecord[] = Array.isArray(res.drivers)
      ? res.drivers
      : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res)
      ? (res as unknown as DriverRecord[])
      : [];

    return {
      total: typeof res.total === "number" ? res.total : list.length,
      drivers: list,
    };
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    return { total: 0, drivers: [] };
  }
}

// Dedicated Driver Portal Client API
export async function driverApi<T = any>(endpoint: string, options: RequestInit & { json?: unknown } = {}): Promise<T> {
  const isAuthEndpoint = endpoint.includes("/login") || endpoint.includes("/register");
  const token = !isAuthEndpoint ? getDriverToken() : null;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${endpoint}`, {
    credentials: "include",
    ...options,
    method: options.method ?? (options.json ? "POST" : "GET"),
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : (data.message ?? data.error ?? "Request failed");
    throw new ApiError(errorMsg, res.status, data.fields);
  }
  return data as T;
}

// Driver Portal Client APIs
export async function driverRegisterApi(payload: any) {
  return driverApi<{ success: boolean; message: string; driver: any }>("/drivers/register", {
    json: payload,
  });
}

export async function driverLoginApi(payload: { email: string; password: string }) {
  return driverApi<{ success: boolean; message: string; token: string; driver: any }>("/drivers/login", {
    json: payload,
  });
}

export async function driverGetMeApi(token?: string) {
  const t = token || getDriverToken();
  return driverApi<any>("/drivers/me", {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
}

export const getDriverMeApi = driverGetMeApi;

export async function driverLogoutApi(): Promise<{ success: boolean; message: string }> {
  const t = getDriverToken();
  try {
    await driverApi<{ success: boolean; message: string }>("/drivers/logout", {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    });
  } catch {}
  clearDriverToken();
  clearDriverInfo();
  return { success: true, message: "Logged out successfully" };
}

export async function driverUpdateStatusApi(token: string, payload: { isOnline: boolean; lat?: number; lng?: number }) {
  return driverApi<{ success: boolean; isOnline: boolean; status: string }>("/drivers/status", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    json: payload,
  });
}

export async function driverGetTripsApi(token: string) {
  return driverApi<{
    success: boolean;
    currentTrips: BookingRecord[];
    availableJobs: BookingRecord[];
    pastTrips: BookingRecord[];
  }>("/drivers/trips", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function driverAcceptTripApi(token: string, bookingId: string) {
  return driverApi<{ success: boolean; message: string; booking: BookingRecord }>(`/drivers/trips/${bookingId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function driverUpdateTripStatusApi(
  token: string,
  bookingId: string,
  status: "on_the_way" | "arrived" | "in_progress" | "completed"
) {
  return driverApi<{ success: boolean; message: string; booking: BookingRecord }>(`/drivers/trips/${bookingId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    json: { status },
  });
}

export type OnlineDriverInfo = {
  id: string;
  name: string;
  vehicleModel: string;
  vehicleColor?: string;
  serviceType: string;
  rating: number;
  status: string;
  location?: { lat: number; lng: number };
};

export async function getOnlineDriversApi(service?: string): Promise<{ count: number; drivers: OnlineDriverInfo[] }> {
  try {
    // Map frontend service to backend vehicle.serviceType
    let targetService = service;
    if (service === "chauffeur") targetService = "limousine";
    const qs = targetService && targetService !== "all" ? `?service=${encodeURIComponent(targetService)}` : "";
    const res = await api<{ success: boolean; count: number; drivers: OnlineDriverInfo[] }>(`/drivers/online${qs}`);
    return {
      count: res.count ?? res.drivers?.length ?? 0,
      drivers: res.drivers || [],
    };
  } catch (err) {
    console.error("Failed to fetch online drivers:", err);
    return { count: 0, drivers: [] };
  }
}

/**
 * Real-time SSE subscription: instantly delivers driver status changes (online/offline)
 */
export function streamOnlineDriversEvents(
  service: string,
  onUpdate: (data: { count: number; drivers: OnlineDriverInfo[] }) => void
): () => void {
  if (typeof window === "undefined" || !("EventSource" in window)) {
    return () => {};
  }

  let targetService = service;
  if (service === "chauffeur") targetService = "limousine";
  const qs = targetService && targetService !== "all" ? `?service=${encodeURIComponent(targetService)}` : "";
  const sseUrl = `${BASE}/drivers/online-stream${qs}`;

  try {
    const es = new EventSource(sseUrl, { withCredentials: true });

    const handlePayload = (raw: string) => {
      try {
        const payload = JSON.parse(raw);
        if (payload?.success) {
          onUpdate({
            count: payload.count ?? payload.drivers?.length ?? 0,
            drivers: payload.drivers || [],
          });
        }
      } catch (err) {
        console.error("Failed parsing SSE driver event:", err);
      }
    };

    es.addEventListener("online_drivers", (e: MessageEvent) => {
      handlePayload(e.data);
    });

    es.onmessage = (e: MessageEvent) => {
      handlePayload(e.data);
    };

    es.onerror = () => {
      // EventSource auto-reconnects on error
    };

    return () => {
      es.close();
    };
  } catch (err) {
    console.error("SSE connection error:", err);
    return () => {};
  }
}

export type PassengerUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  savedPlaces?: Array<{ label: string; name: string; address?: string; lat: number; lng: number }>;
  preferredPaymentMethod?: string;
};

// Universal Client Cookie Helpers
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax${secure}`;
}

export function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`;
}

// Passenger Auth & Profile Cookie Helpers
const PASSENGER_TOKEN_KEY = "syd_passenger_token";
const PASSENGER_INFO_KEY = "syd_passenger_info";

export function getPassengerToken(): string | null {
  return getCookie(PASSENGER_TOKEN_KEY);
}

export function setPassengerToken(token: string) {
  setCookie(PASSENGER_TOKEN_KEY, token);
}

export function clearPassengerToken() {
  clearCookie(PASSENGER_TOKEN_KEY);
}

export function getPassengerInfo(): PassengerUser | null {
  const raw = getCookie(PASSENGER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setPassengerInfo(passenger: PassengerUser | any) {
  setCookie(PASSENGER_INFO_KEY, JSON.stringify(passenger));
}

export function clearPassengerInfo() {
  clearCookie(PASSENGER_INFO_KEY);
}

export async function getPassengerMeApi(): Promise<{ success: boolean; passenger: PassengerUser }> {
  return passengerApi<{ success: boolean; passenger: PassengerUser }>("/passengers/me");
}

export async function passengerLogoutApi(): Promise<{ success: boolean; message: string }> {
  try {
    await passengerApi<{ success: boolean; message: string }>("/passengers/logout", {
      method: "POST",
    });
  } catch {}
  clearPassengerToken();
  clearPassengerInfo();
  return { success: true, message: "Logged out successfully" };
}

// Driver Auth & Profile Cookie Helpers
const DRIVER_TOKEN_KEY = "syd_driver_token";
const DRIVER_INFO_KEY = "syd_driver_info";

export function getDriverToken(): string | null {
  return getCookie(DRIVER_TOKEN_KEY);
}

export function setDriverToken(token: string) {
  setCookie(DRIVER_TOKEN_KEY, token);
}

export function clearDriverToken() {
  clearCookie(DRIVER_TOKEN_KEY);
}

export function getDriverInfo(): any | null {
  const raw = getCookie(DRIVER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setDriverInfo(driver: any) {
  setCookie(DRIVER_INFO_KEY, JSON.stringify(driver));
}

export function clearDriverInfo() {
  clearCookie(DRIVER_INFO_KEY);
}

// Admin Auth & Profile Cookie Helpers
const ADMIN_INFO_KEY = "syd_admin_info";

export function getAdminInfo(): AdminUser | null {
  const raw = getCookie(ADMIN_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAdminInfo(admin: AdminUser | any) {
  setCookie(ADMIN_INFO_KEY, JSON.stringify(admin));
}

export function clearAdminInfo() {
  clearCookie(ADMIN_INFO_KEY);
}

export async function passengerApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isAuthEndpoint =
    endpoint.includes("/login") ||
    endpoint.includes("/register") ||
    endpoint.includes("/send-otp") ||
    endpoint.includes("/verify-otp");

  const token = !isAuthEndpoint ? getPassengerToken() : null;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${endpoint}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : (data.message ?? data.error ?? "Request failed");
    throw new Error(errorMsg);
  }
  return data as T;
}


