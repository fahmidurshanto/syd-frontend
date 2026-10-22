"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { driverLoginApi } from "@/lib/api";

export default function DriverLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await driverLoginApi({ email, password });
      if (res.token) {
        localStorage.setItem("driver_token", res.token);
        localStorage.setItem("driver_info", JSON.stringify(res.driver));
        router.push("/driver/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials or account pending verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-24 sm:py-32 relative bg-[#07090e] flex items-center justify-center">
      <div className="w-[min(460px,100%-2.5rem)] mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2">
            Sydney Airport Transfer
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-white mt-2">
            Driver Partner Portal
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Sign in to access your dispatch dashboard and start driving.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-white/10 bg-[#0c101a] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@example.com"
                className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In to Drive"}
            </button>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-zinc-400">
                New to the platform?{" "}
                <Link href="/driver/register" className="text-amber-400 hover:underline font-medium">
                  Register as Driver
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
