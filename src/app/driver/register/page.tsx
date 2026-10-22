"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { driverRegisterApi } from "@/lib/api";
import { Icon } from "@/components/Icon";

export default function DriverRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    regoPlate: "",
    color: "",
    serviceType: "taxi",
    passengerCapacity: 4,
    luggageCapacity: 3,
    driverLicenseNumber: "",
    pointToPointCardNumber: "",
    abnNumber: "",
    insurancePolicyNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "year" || name === "passengerCapacity" || name === "luggageCapacity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await driverRegisterApi(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-24 sm:py-32 relative bg-[#07090e] flex items-center justify-center">
      <div className="w-[min(800px,100%-2.5rem)] mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 inline-flex items-center gap-2.5">
            Partner with Sydney Airport Transfer
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl tracking-tight text-white mt-3">
            Driver Onboarding & Registration
          </h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">
            Drive with Greater Sydney's premier taxi and limousine network. Flexible hours, fair payouts.
          </p>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl border border-white/10 bg-[#0c101a] shadow-2xl backdrop-blur-xl">
          {success ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-400">
                <Icon.check width={32} height={32} />
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">Registration Submitted!</h2>
              <p className="text-zinc-300 max-w-md mx-auto text-sm leading-relaxed mb-6">
                Your application has been received. Our operations team will verify your NSW driver credentials within 24 hours.
              </p>
              <Link
                href="/driver/login"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95"
              >
                Go to Driver Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Personal Details */}
              <div>
                <h3 className="font-display font-semibold text-amber-400 text-lg mb-4 flex items-center gap-2">
                  <span>1. Personal & Contact Details</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="driver@example.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Phone Number (Australian) *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+61 400 000 000"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Account Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="font-display font-semibold text-amber-400 text-lg mb-4 flex items-center gap-2">
                  <span>2. Vehicle Specifications</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Vehicle Make *</label>
                    <input
                      type="text"
                      name="make"
                      required
                      value={form.make}
                      onChange={handleChange}
                      placeholder="Toyota, Mercedes-Benz"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Model *</label>
                    <input
                      type="text"
                      name="model"
                      required
                      value={form.model}
                      onChange={handleChange}
                      placeholder="Camry Hybrid, E-Class"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Year of Manufacture *</label>
                    <input
                      type="number"
                      name="year"
                      required
                      min={2005}
                      max={2030}
                      value={form.year}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">NSW Rego Plate *</label>
                    <input
                      type="text"
                      name="regoPlate"
                      required
                      value={form.regoPlate}
                      onChange={handleChange}
                      placeholder="e.g. ABC-123"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm uppercase focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Vehicle Color *</label>
                    <input
                      type="text"
                      name="color"
                      required
                      value={form.color}
                      onChange={handleChange}
                      placeholder="Black, Silver, White"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Service Category *</label>
                    <select
                      name="serviceType"
                      value={form.serviceType}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-[#111624] text-white text-sm focus:border-amber-400 focus:outline-none"
                    >
                      <option value="taxi">Taxi Service</option>
                      <option value="limousine">Limousine Service</option>
                      <option value="both">Both (Taxi & Limousine)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* NSW Transport Credentials */}
              <div>
                <h3 className="font-display font-semibold text-amber-400 text-lg mb-4 flex items-center gap-2">
                  <span>3. NSW Licensing & Authorisation</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">NSW Driver Licence Number *</label>
                    <input
                      type="text"
                      name="driverLicenseNumber"
                      required
                      value={form.driverLicenseNumber}
                      onChange={handleChange}
                      placeholder="8-digit license number"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Point to Point / Driver Authority ID *</label>
                    <input
                      type="text"
                      name="pointToPointCardNumber"
                      required
                      value={form.pointToPointCardNumber}
                      onChange={handleChange}
                      placeholder="NSW Point to Point Authority ID"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Australian Business Number (ABN)</label>
                    <input
                      type="text"
                      name="abnNumber"
                      value={form.abnNumber}
                      onChange={handleChange}
                      placeholder="11-digit ABN"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Comprehensive / CTP Policy No.</label>
                    <input
                      type="text"
                      name="insurancePolicyNumber"
                      value={form.insurancePolicyNumber}
                      onChange={handleChange}
                      placeholder="Policy reference number"
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center h-12 rounded-full font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {loading ? "Submitting Application..." : "Submit Driver Application"}
              </button>

              <p className="text-center text-xs text-zinc-400">
                Already registered?{" "}
                <Link href="/driver/login" className="text-amber-400 hover:underline">
                  Log in to Driver Portal
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
