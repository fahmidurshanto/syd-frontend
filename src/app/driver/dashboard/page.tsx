"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  driverGetMeApi,
  driverUpdateStatusApi,
  driverGetTripsApi,
  driverAcceptTripApi,
  driverUpdateTripStatusApi,
  money,
  API_URL,
  type BookingRecord,
} from "@/lib/api";
import { Icon } from "@/components/Icon";

export default function DriverDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [currentTrips, setCurrentTrips] = useState<BookingRecord[]>([]);
  const [availableJobs, setAvailableJobs] = useState<BookingRecord[]>([]);
  const [pastTrips, setPastTrips] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [newJobAlert, setNewJobAlert] = useState<any | null>(null);

  // Play audible chime for incoming dispatch requests
  const playDispatchChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Load Auth Token & Establish Live SSE Dispatch Connection
  useEffect(() => {
    const savedToken = localStorage.getItem("driver_token");
    if (!savedToken) {
      router.push("/driver/login");
      return;
    }
    setToken(savedToken);

    // Fetch Profile
    driverGetMeApi(savedToken)
      .then((data) => {
        setDriver(data);
        setIsOnline(data.isOnline || false);
      })
      .catch(() => {
        localStorage.removeItem("driver_token");
        router.push("/driver/login");
      });

    loadTrips(savedToken);

    // 1. Real-Time SSE Dispatch Connection for online drivers
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_URL}/api/v1/drivers/events`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload) {
            // New booking placed
            if (payload.type === "new_job") {
              playDispatchChime();
              setNewJobAlert(payload);
              loadTrips(savedToken, true);

              // Native desktop notification if permitted
              if (typeof window !== "undefined" && "Notification" in window) {
                if (Notification.permission === "granted") {
                  new Notification(`🚖 New Ride Request #${payload.bookingNumber}`, {
                    body: `${payload.pickup?.name} ➔ ${payload.destination?.name || "As Directed"} ($${(payload.fare?.total / 100).toFixed(2)})`,
                    icon: "/favicon.ico",
                  });
                } else if (Notification.permission !== "denied") {
                  Notification.requestPermission();
                }
              }
            } else if (payload.type === "job_taken") {
              // Someone took the job or status changed
              loadTrips(savedToken, true);
              setNewJobAlert((prev: any) => (prev?.bookingId === payload.bookingId ? null : prev));
            }
          }
        } catch (e) {
          console.error("Error parsing driver event:", e);
        }
      };
    } catch (e) {
      console.warn("SSE connection error", e);
    }

    // 2. Background polling fallback every 3.5 seconds
    const interval = setInterval(() => {
      loadTrips(savedToken, true);
    }, 3500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const loadTrips = async (authToken: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await driverGetTripsApi(authToken);
      setCurrentTrips(res.currentTrips || []);
      setAvailableJobs(res.availableJobs || []);
      setPastTrips(res.pastTrips || []);
    } catch (err: any) {
      console.error("Failed to load driver trips", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    if (!token) return;
    setStatusLoading(true);
    setErrorMsg("");
    try {
      const nextOnline = !isOnline;
      await driverUpdateStatusApi(token, { isOnline: nextOnline });
      setIsOnline(nextOnline);
      loadTrips(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to change online status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAcceptJob = async (bookingId: string) => {
    if (!token) return;
    setActionId(bookingId);
    setErrorMsg("");
    try {
      await driverAcceptTripApi(token, bookingId);
      loadTrips(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to accept job");
    } finally {
      setActionId(null);
    }
  };

  const handleUpdateStatus = async (
    bookingId: string,
    status: "on_the_way" | "arrived" | "in_progress" | "completed"
  ) => {
    if (!token) return;
    setActionId(bookingId);
    setErrorMsg("");
    try {
      await driverUpdateTripStatusApi(token, bookingId, status);
      loadTrips(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update trip progress");
    } finally {
      setActionId(null);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("driver_token");
    localStorage.removeItem("driver_info");
    router.push("/driver/login");
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-[#07090e] pt-32 text-center text-zinc-400">
        Loading Driver Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] pt-28 pb-20 text-white">
      <div className="w-[min(1240px,100%-2.5rem)] mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 sm:p-6 rounded-3xl border border-white/10 bg-[#0c101a]">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold">{driver.name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30 uppercase">
                {driver.vehicle?.serviceType || "Taxi"} Driver
              </span>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Vehicle: {driver.vehicle?.make} {driver.vehicle?.model} • Plate:{" "}
              <span className="text-amber-400 font-mono font-semibold">{driver.vehicle?.regoPlate}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Online / Offline Button */}
            <button
              onClick={handleToggleOnline}
              disabled={statusLoading}
              title={
                driver.status === "pending_verification"
                  ? "Your account is pending admin approval"
                  : driver.status === "suspended"
                  ? "Your account is suspended"
                  : "Click to toggle online/offline"
              }
              className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                isOnline
                  ? "bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : driver.status === "pending_verification"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-black animate-ping" : "bg-zinc-500"
                }`}
              />
              {statusLoading ? "Updating..." : isOnline ? "You are Online" : "Go Online"}
            </button>

            <button
              onClick={handleSignOut}
              className="text-xs px-4 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Real-time Dispatch Live Alert Banner */}
        {newJobAlert && (
          <div className="p-5 sm:p-6 rounded-3xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950/80 via-[#0e171e] to-emerald-950/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-400 grid place-items-center shrink-0">
                <span className="text-xl">🚖</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-300">#{newJobAlert.bookingNumber}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    New Incoming Request
                  </span>
                  <span className="text-xs font-bold text-emerald-400">{money(newJobAlert.fare?.total)}</span>
                </div>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {newJobAlert.pickup?.name} ➔ {newJobAlert.destination?.name || "As Directed"}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Service: <span className="text-amber-300 uppercase font-medium">{newJobAlert.service}</span> • {newJobAlert.passengers} Pax
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => {
                  handleAcceptJob(newJobAlert.bookingId);
                  setNewJobAlert(null);
                }}
                disabled={actionId === newJobAlert.bookingId}
                className="flex-1 md:flex-initial h-11 px-6 rounded-xl font-bold text-xs text-zinc-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300 hover:brightness-110 shadow-lg transition active:scale-95 text-center whitespace-nowrap"
              >
                {actionId === newJobAlert.bookingId ? "Accepting..." : "Accept Now"}
              </button>
              <button
                onClick={() => setNewJobAlert(null)}
                className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {driver.status === "pending_verification" && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div>
                <p className="font-semibold text-white">Application Under Review (Pending Verification)</p>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  An Administrator or Operations Manager must approve your NSW driver license credentials before you can go online.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-semibold self-start sm:self-auto">
              Status: Pending Approval
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Driver Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d121f]">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Account Status</p>
            <p className="text-xl font-bold mt-1 text-white capitalize">{driver.status.replace("_", " ")}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d121f]">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Completed Trips</p>
            <p className="text-xl font-bold mt-1 text-amber-400">{driver.totalTrips || 0}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d121f]">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Driver Rating</p>
            <p className="text-xl font-bold mt-1 text-emerald-400">★ {driver.rating?.toFixed(1) || "5.0"}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d121f]">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Wallet Balance</p>
            <p className="text-xl font-bold mt-1 text-white">{money(driver.walletBalanceCents || 0)}</p>
          </div>
        </div>

        {/* 1. Active Ongoing Trips */}
        <div>
          <h2 className="font-display font-bold text-xl mb-4 text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Current Active Trip ({currentTrips.length})
          </h2>

          {currentTrips.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/10 bg-[#0c101a] text-center text-zinc-400 text-sm">
              No active trip in progress. {isOnline ? "Stay online to receive dispatch calls." : "Go online to receive jobs."}
            </div>
          ) : (
            <div className="space-y-4">
              {currentTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="p-6 rounded-2xl border border-amber-400/30 bg-gradient-to-b from-[#161c2e] to-[#0c101a] shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-white/10 text-amber-300 font-bold">
                        {trip.bookingNumber}
                      </span>
                      <span className="ml-3 text-xs uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Status: {trip.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Total Fare</p>
                      <p className="text-xl font-bold text-emerald-400">{money(trip.fare?.total)}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 my-5 text-sm">
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Pickup</p>
                      <p className="text-white font-medium mt-0.5">{trip.pickup?.name}</p>
                      <p className="text-xs text-zinc-400">{trip.pickup?.address}</p>

                      <p className="text-xs text-zinc-400 font-medium mt-3">Destination</p>
                      <p className="text-white font-medium mt-0.5">{trip.destination?.name || "As Directed"}</p>
                      <p className="text-xs text-zinc-400">{trip.destination?.address}</p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Passenger Details</p>
                      <p className="text-white font-medium mt-0.5">{trip.passengerName}</p>
                      <p className="text-xs text-amber-300 font-mono mt-0.5">{trip.passengerPhone}</p>
                      <p className="text-xs text-zinc-400 mt-2">Passengers: {trip.passengers || 1}</p>
                      {trip.flightNumber && (
                        <p className="text-xs text-zinc-300 mt-1">Flight Number: {trip.flightNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Trip Progression Buttons */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-4 border-t border-white/10">
                    {trip.status === "assigned" && (
                      <button
                        onClick={() => handleUpdateStatus(trip._id, "on_the_way")}
                        disabled={actionId === trip._id}
                        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 transition text-center"
                      >
                        En Route to Pickup
                      </button>
                    )}
                    {trip.status === "on_the_way" && (
                      <button
                        onClick={() => handleUpdateStatus(trip._id, "arrived")}
                        disabled={actionId === trip._id}
                        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition text-center"
                      >
                        Arrived at Pickup
                      </button>
                    )}
                    {trip.status === "arrived" && (
                      <button
                        onClick={() => handleUpdateStatus(trip._id, "in_progress")}
                        disabled={actionId === trip._id}
                        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition text-center"
                      >
                        Start Trip (Passenger Onboard)
                      </button>
                    )}
                    {trip.status === "in_progress" && (
                      <button
                        onClick={() => handleUpdateStatus(trip._id, "completed")}
                        disabled={actionId === trip._id}
                        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold bg-purple-500 text-white hover:bg-purple-600 transition text-center"
                      >
                        Complete Trip & Collect Fare
                      </button>
                    )}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        trip.pickup?.address || trip.pickup?.name || ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 transition text-center"
                    >
                      Open Google Maps Navigation
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Available Job Board */}
        <div>
          <h2 className="font-display font-bold text-xl mb-4 text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Available Dispatch Requests ({availableJobs.length})
          </h2>

          {!isOnline ? (
            <div className="p-8 rounded-2xl border border-white/10 bg-[#0c101a] text-center text-zinc-400 text-sm">
              You are currently offline. Click "Go Online" above to browse and accept available trips.
            </div>
          ) : availableJobs.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/10 bg-[#0c101a] text-center text-zinc-400 text-sm">
              No new dispatch requests waiting at this moment. New jobs will appear here automatically.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {availableJobs.map((job) => (
                <div
                  key={job._id}
                  className="p-5 rounded-2xl border border-white/10 bg-[#0d121f] hover:border-amber-400/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs font-mono font-bold text-amber-300">{job.bookingNumber}</span>
                      <span className="text-base font-bold text-emerald-400">{money(job.fare?.total)}</span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-400">From:</span>{" "}
                        <span className="text-white font-medium">{job.pickup?.name}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">To:</span>{" "}
                        <span className="text-white font-medium">{job.destination?.name || "As Directed"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Service:</span>{" "}
                        <span className="text-amber-300 uppercase font-medium">{job.service}</span> •{" "}
                        <span className="text-zinc-300">{job.passengers} Pax</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptJob(job._id)}
                    disabled={actionId === job._id}
                    className="mt-4 w-full h-10 rounded-xl font-semibold text-xs text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow transition"
                  >
                    {actionId === job._id ? "Accepting..." : "Accept Job"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Past Completed Trips */}
        <div>
          <h2 className="font-display font-bold text-xl mb-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
              <span>Past Trips ({pastTrips.length})</span>
            </div>
            {pastTrips.length > 0 && (
              <span className="text-xs font-mono font-medium text-zinc-400">
                Completed & History
              </span>
            )}
          </h2>

          {pastTrips.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/10 bg-[#0c101a] text-center text-zinc-400 text-sm">
              No completed trips recorded yet. Once you complete a trip, its record will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {pastTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="p-5 rounded-2xl border border-white/10 bg-[#0c101a] hover:border-white/20 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-white/10 text-amber-300 font-bold">
                        #{trip.bookingNumber}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          trip.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {trip.status}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(trip.updatedAt || trip.createdAt || Date.now()).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/20">
                        {trip.service || "Taxi"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold mt-0.5">●</span>
                        <span className="text-zinc-400">From:</span>
                        <span className="text-zinc-200 font-medium">
                          {trip.pickup?.name || trip.pickup?.address || "Pickup"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold mt-0.5">●</span>
                        <span className="text-zinc-400">To:</span>
                        <span className="text-zinc-200 font-medium">
                          {trip.destination?.name || trip.destination?.address || "As Directed"}
                        </span>
                      </div>
                    </div>

                    {trip.passenger && (
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2 pt-1">
                        <span>Passenger: <strong className="text-zinc-300 font-medium">{trip.passenger.name}</strong></span>
                        {trip.passenger.phone && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-zinc-400">{trip.passenger.phone}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-white/5 shrink-0">
                    <span className="text-base font-bold text-emerald-400">
                      {money(trip.fare?.total)}
                    </span>
                    <span className="text-[11px] text-zinc-400 capitalize">
                      {trip.paymentStatus || "Paid"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
