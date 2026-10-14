"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuth";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");

  const { isAuthenticated, loading, login } = useAdminAuth();
  const router = useRouter();

  // If already authenticated, redirect immediately to /admin
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/admin");
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSeedMessage("");

    const result = await login(email, password);
    setIsLoading(false);

    if (result.ok) {
      router.push("/admin");
    } else {
      setError(result.error || "Invalid credentials. Please verify your email and password.");
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setError("");
    setSeedMessage("");
    try {
      const res = await api<{ success: boolean; message: string }>("/admins/seed", {
        method: "POST",
      });
      setSeedMessage(res.message || "Admin accounts verified/seeded successfully.");
      setEmail("admin@sydtransport.com.au");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to seed default accounts."
      );
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span className="text-xs text-white/50 tracking-wider uppercase font-medium">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(223 22% 14%), var(--ink-950) 80%)",
      }}
    >
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-40" />

      <div className="glass max-w-md w-full p-8 sm:p-10 relative z-10 border border-white/10 shadow-2xl rounded-2xl">
        {/* Brand Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--gold-300), var(--gold-600))",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-950)"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* Portal Header */}
        <div className="text-center mb-8">
          <span className="eyebrow justify-center mb-2">SYD OPS PORTAL</span>
          <h1 className="display text-2xl text-white">Fleet & Bookings Admin</h1>
          <p className="mute text-xs mt-1">Authorized personnel and operations staff only</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border border-red-500/30 bg-red-500/10 text-red-200">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Seed Info Alert */}
        {seedMessage && (
          <div className="mb-6 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{seedMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@sydtransport.com.au"
              required
              autoFocus
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs uppercase tracking-wider font-semibold text-white/70">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition pr-10"
              />
            </div>
          </div>

          {/* Quick-fill helpers for demo testing */}
          <div className="pt-2">
            <div className="text-[11px] text-white/40 mb-1.5 font-medium">Quick Credentials:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@sydtransport.com.au");
                  setPassword("AdminPassword123!");
                  setError("");
                }}
                className="py-1.5 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/40 text-left transition text-white/70 hover:text-white"
              >
                <div className="font-semibold text-amber-400 text-[11px]">System Admin</div>
                <div className="text-[10px] text-white/40 truncate">admin@sydtransport...</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("manager@sydtransport.com.au");
                  setPassword("ManagerPassword123!");
                  setError("");
                }}
                className="py-1.5 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/40 text-left transition text-white/70 hover:text-white"
              >
                <div className="font-semibold text-amber-400 text-[11px]">Operations Manager</div>
                <div className="text-[10px] text-white/40 truncate">manager@sydtransport...</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-gold py-3 justify-center text-sm font-semibold tracking-wide uppercase transition hover:brightness-110 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              "Sign In to Dispatch"
            )}
          </button>
        </form>

        {/* Database seed button helper */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
          <span>First time setup?</span>
          <button
            type="button"
            onClick={handleSeed}
            disabled={isSeeding}
            className="text-amber-400/80 hover:text-amber-300 underline font-medium transition"
          >
            {isSeeding ? "Seeding..." : "Seed Default Accounts"}
          </button>
        </div>

        {/* Return to website */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <a
            href="/"
            className="text-xs text-white/50 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Return to Public Website
          </a>
        </div>
      </div>
    </div>
  );
}
