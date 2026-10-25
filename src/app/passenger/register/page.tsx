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

export default function PassengerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return setError("Please fill in all required fields");
    setError("");
    setLoading(true);
    try {
      const res = await passengerApi<{ success: boolean; token: string; passenger?: any }>("/passengers/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          password: password || undefined,
        }),
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
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-[#0e121d]/85 backdrop-blur-2xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 grid place-items-center mx-auto mb-4">
            <Icon.user width={28} height={28} />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white">
            Create Passenger Account
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Book faster, save frequent destinations, and track trips anytime.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Mobile Phone
            </label>
            <input
              type="tel"
              placeholder="0412 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Create Password (Optional)
            </label>
            <input
              type="password"
              placeholder="Min. 6 characters (or use OTP later)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl px-4 text-sm font-medium text-white border border-white/10 bg-[#07090e]/70 focus:border-amber-400 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg mt-4 transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account & Continue"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/passenger/login" className="text-amber-400 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
