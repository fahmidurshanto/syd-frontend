"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  passengerApi,
  setPassengerToken,
  setPassengerInfo,
  clearDriverToken,
  clearDriverInfo,
  clearAdminInfo,
} from "@/lib/api";
import { Icon } from "@/components/Icon";

export default function PassengerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return setError("Please enter your mobile phone or email");
    setError("");
    setLoading(true);
    try {
      const res = await passengerApi<{ success: boolean; message: string; debugCode?: string }>(
        "/passengers/send-otp",
        {
          method: "POST",
          body: JSON.stringify({ phoneOrEmail: identifier }),
        }
      );
      setOtpSent(true);
      if (res.debugCode) {
        setDebugOtp(res.debugCode);
        setOtp(res.debugCode);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return setError("Please enter the 6-digit verification code");
    setError("");
    setLoading(true);
    try {
      const res = await passengerApi<{ success: boolean; token: string; passenger?: any }>("/passengers/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phoneOrEmail: identifier, otp }),
      });
      if (res.token) {
        clearDriverToken();
        clearDriverInfo();
        clearAdminInfo();
        setPassengerToken(res.token);
        if (res.passenger) {
          setPassengerInfo(res.passenger);
        }
        window.dispatchEvent(new Event("syd_auth_change"));
        router.push("/passenger/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return setError("Please enter identifier and password");
    setError("");
    setLoading(true);
    try {
      const res = await passengerApi<{ success: boolean; token: string; passenger?: any }>("/passengers/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      if (res.token) {
        clearDriverToken();
        clearDriverInfo();
        clearAdminInfo();
        setPassengerToken(res.token);
        if (res.passenger) {
          setPassengerInfo(res.passenger);
        }
        window.dispatchEvent(new Event("syd_auth_change"));
        router.push("/passenger/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 grid place-items-center mx-auto mb-4">
            <Icon.user width={28} height={28} />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white">
            Passenger Portal
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Sign in to track your rides, view receipts, and manage bookings.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl p-1 bg-white/5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === "otp"
                ? "bg-amber-400 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            One-Time Code (OTP)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === "password"
                ? "bg-amber-400 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Password
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {mode === "otp" ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Mobile Number or Email
                </label>
                <input
                  type="text"
                  placeholder="0412 345 678 or name@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {loading ? "Sending Code..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {debugOtp && (
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs">
                  Your code: <strong className="font-mono text-white text-sm">{debugOtp}</strong>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Enter 6-digit Code sent to {identifier}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-14 w-full rounded-xl px-4 text-center font-mono font-bold text-2xl tracking-widest text-amber-400 border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-xs text-zinc-400 hover:text-white transition pt-2"
              >
                ← Change number / email
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Email or Mobile Number
              </label>
              <input
                type="text"
                placeholder="name@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-12 w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In with Password"}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-zinc-400">
          New to Sydney Airport Transfer?{" "}
          <Link href="/passenger/register" className="text-amber-400 hover:underline font-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
