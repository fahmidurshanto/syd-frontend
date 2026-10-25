"use client";

import { useEffect, useState } from "react";
import { API_URL, money } from "@/lib/api";
import { Icon } from "@/components/Icon";

export interface TripTrackerProps {
  booking: {
    id?: string;
    number: string;
    status: string;
    pickup?: { name: string; address?: string };
    destination?: { name: string; address?: string };
    vehicleType?: string;
    fare?: { total: number };
    driver?: {
      name: string;
      phone: string;
      vehicle?: {
        make: string;
        model: string;
        year?: number;
        regoPlate: string;
        color: string;
      };
      rating?: number;
    };
  };
  onClose?: () => void;
}

const STATUS_STEPS = [
  { key: "confirmed", label: "Booking Placed", desc: "Searching for nearby driver" },
  { key: "assigned", label: "Driver Accepted", desc: "Driver assigned & preparing" },
  { key: "on_the_way", label: "On The Way", desc: "Driver is heading to pickup" },
  { key: "arrived", label: "Driver Arrived", desc: "Driver has reached pickup spot" },
  { key: "in_progress", label: "Trip In Progress", desc: "Enjoy your comfortable ride" },
  { key: "completed", label: "Completed", desc: "Arrived at destination safely" },
];

export function TripTracker({ booking, onClose }: TripTrackerProps) {
  const bookingNum = booking.number || (booking as any).bookingNumber || "";
  const [currentStatus, setCurrentStatus] = useState<string>(booking.status || "confirmed");
  const [driver, setDriver] = useState<any>(booking.driver || null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [audioAllowed, setAudioAllowed] = useState(false);

  // Play subtle ding sound on status transition
  const triggerNotification = (title: string, body: string) => {
    setAlertMessage(body);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, { body, icon: "/favicon.ico" });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      }
    } catch {}

    // Audio chime using Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  useEffect(() => {
    if (!bookingNum) return;

    // 1. Initial full fetch to get up-to-date driver status
    const fetchLatestBooking = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/bookings/${bookingNum}`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking) {
            if (data.booking.status) setCurrentStatus(data.booking.status);
            if (data.booking.driver) setDriver(data.booking.driver);
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest booking:", err);
      }
    };
    fetchLatestBooking();

    // 2. Real-Time SSE Listener
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_URL}/api/v1/bookings/${bookingNum}/events`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload) {
            if (payload.status) {
              setCurrentStatus(payload.status);
            }
            if (payload.driver) {
              setDriver(payload.driver);
            }
            if (payload.message) {
              triggerNotification(`Trip Update: ${bookingNum}`, payload.message);
            }
            setLastUpdated(new Date());
          }
        } catch (e) {
          console.error("Error parsing booking event:", e);
        }
      };

      eventSource.onerror = () => {
        // Fallback to polling every 2.5 seconds if SSE connection drops
      };
    } catch (e) {
      console.warn("SSE not available, falling back to polling", e);
    }

    // 3. Fallback Interval Poller (every 2.5 seconds) to ensure status is 100% updated in real time
    const poller = setInterval(fetchLatestBooking, 2500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(poller);
    };
  }, [bookingNum]);

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const activeIndex = currentStepIdx >= 0 ? currentStepIdx : 0;

  return (
    <div className="reveal max-w-2xl mx-auto rounded-3xl border border-white/10 bg-[#0c101a]/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
      {/* Alert banner when a driver takes action */}
      {alertMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center gap-3 animate-pulse">
          <div className="h-3 w-3 rounded-full bg-amber-400"></div>
          <p className="text-sm font-medium text-amber-200">{alertMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            Live Trip Tracking
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white mt-0.5">
            Booking #{booking.number}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize tracking-wide ${
              currentStatus === "completed"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : currentStatus === "assigned" || currentStatus === "on_the_way" || currentStatus === "arrived"
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current animate-ping"></span>
            {currentStatus.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Driver Information Card (Revealed as soon as Driver Accepts) */}
      {driver ? (
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-transparent border border-amber-400/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 grid place-items-center text-zinc-950 font-display font-bold text-lg sm:text-xl shadow-lg">
                {driver.name ? driver.name.charAt(0).toUpperCase() : "D"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">{driver.name}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold shrink-0">
                    ★ {driver.rating ? Number(driver.rating).toFixed(1) : "5.0"}
                  </span>
                </div>
                {driver.vehicle ? (
                  <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}</span>
                    {driver.vehicle.regoPlate && (
                      <span className="font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-[10px] sm:text-xs">
                        {driver.vehicle.regoPlate}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-zinc-400">Assigned Official Driver</p>
                )}
              </div>
            </div>

            {driver.phone && (
              <a
                href={`tel:${driver.phone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs text-zinc-950 bg-amber-400 hover:bg-amber-300 transition shadow-md active:scale-95 shrink-0"
              >
                <Icon.phone width={14} height={14} />
                Call Driver ({driver.phone})
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
            <p className="text-xs text-zinc-300">
              Matching your booking with the closest available certified driver...
            </p>
          </div>
        </div>
      )}

      {/* Interactive Trip Timeline */}
      <div className="mt-8 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Trip Progress
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                <div
                  className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-400 border-emerald-400"
                      : isCurrent
                      ? "bg-amber-400 border-amber-400 ring-4 ring-amber-400/20 animate-pulse"
                      : "bg-zinc-800 border-zinc-600"
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold transition ${
                      isCurrent
                        ? "text-amber-400 font-bold"
                        : isCompleted
                        ? "text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pickup & Destination Summary */}
      {(booking.pickup || booking.destination) && (
        <div className="mt-8 pt-6 border-t border-white/10 grid gap-3 text-xs">
          {booking.pickup && (
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5 font-bold">●</span>
              <div>
                <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Pickup</span>
                <p className="text-white font-medium">{booking.pickup.name}</p>
              </div>
            </div>
          )}
          {booking.destination && (
            <div className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 font-bold">■</span>
              <div>
                <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Destination</span>
                <p className="text-white font-medium">{booking.destination.name}</p>
              </div>
            </div>
          )}
          {booking.fare?.total && (
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-sm font-semibold">
              <span className="text-zinc-400">Total Fixed Fare:</span>
              <span className="text-amber-400 font-display text-base">
                {money(booking.fare.total)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer Buttons */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3 justify-end">
        <button
          onClick={() => {
            if (onClose) onClose();
            else window.location.href = "/";
          }}
          className="px-6 py-2.5 rounded-full font-semibold text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 transition"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
