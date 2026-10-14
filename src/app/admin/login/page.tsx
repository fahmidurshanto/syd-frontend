"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuth";
import { Icon } from "@/components/Icon";

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      const ok = login(passcode);
      if (ok) {
        router.push("/admin");
      } else {
        setError("Invalid access code. Please verify credentials.");
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "radial-gradient(ellipse at top, hsl(223 22% 14%), var(--ink-950) 80%)" }}>
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-40" />

      <div className="glass max-w-md w-full p-8 sm:p-10 relative z-10 border border-white/10 shadow-2xl rounded-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--gold-300), var(--gold-600))" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-950)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="eyebrow justify-center mb-2">SYD OPS PORTAL</span>
          <h1 className="display text-2xl text-white">Fleet & Bookings Admin</h1>
          <p className="mute text-xs mt-1">Authorized personnel and dispatch staff only</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl text-xs flex items-center gap-2 border border-red-500/30 bg-red-500/10 text-red-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-2">
              Security Access Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter access code (e.g. admin or syd2026)"
                required
                autoFocus
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1.5">
              Default passcode: <code className="text-gold font-mono">syd2026</code> or <code className="text-gold font-mono">admin</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-gold py-3 justify-center text-sm font-semibold tracking-wide uppercase transition hover:brightness-110"
          >
            {isLoading ? "Authenticating..." : "Sign In to Dispatch"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <a href="/" className="text-xs text-white/50 hover:text-white transition flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Return to Public Website
          </a>
        </div>
      </div>
    </div>
  );
}
