"use client";

import { useState, useEffect, useTransition } from "react";
import { Loader2, CheckCircle, ShieldCheck, Mail, Phone, MapPin, Hash } from "lucide-react";
import { updateProfile } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.split("; ").find((c) => c.startsWith("web_access_token="))?.split("=")[1] ?? null;
}

interface Profile {
  id: string;
  customerNumber: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
}

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nassarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const inputClass =
  "w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-[#A0111C] focus:outline-none focus:ring-2 focus:ring-[#A0111C]/20";

const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/auth/customer/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateProfile(form);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setProfile((prev) => (prev ? { ...prev, ...form } : prev));
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-black/[0.06] bg-white/80 px-6 py-5 shadow-sm shadow-black/[0.03] backdrop-blur">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
          Profile &amp; Settings
        </h1>
        <p className="mt-0.5 text-sm text-gray-400">Update your personal information</p>
      </div>

      {/* Account details strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-black/[0.06] bg-white/80 p-5 shadow-sm shadow-black/[0.03] backdrop-blur">
          <div className="flex items-center gap-2 text-gray-400">
            <Hash className="h-3.5 w-3.5 text-[#A0111C]" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Customer ID</p>
          </div>
          <p className="mt-2 truncate font-mono text-sm text-gray-800">
            {profile?.customerNumber ?? "—"}
          </p>
        </div>
        <div className="rounded-3xl border border-black/[0.06] bg-white/80 p-5 shadow-sm shadow-black/[0.03] backdrop-blur">
          <div className="flex items-center gap-2 text-gray-400">
            <Mail className="h-3.5 w-3.5 text-[#A0111C]" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Email</p>
          </div>
          <p className="mt-2 truncate text-sm text-gray-800">{profile?.email ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-black/[0.06] bg-white/80 p-5 shadow-sm shadow-black/[0.03] backdrop-blur">
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-[#A0111C]" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Location</p>
          </div>
          <p className="mt-2 truncate text-sm text-gray-800">
            {[profile?.city, profile?.state].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-black/[0.06] bg-white/80 p-6 shadow-sm shadow-black/[0.03] backdrop-blur sm:p-8">
        <h2 className="mb-1 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
          Personal information
        </h2>
        <p className="mb-6 text-sm text-gray-400">
          Keep your details current so our team can reach you about your reservations.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={labelClass}>First name</label>
            <input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Last name</label>
            <input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="emailStatic" className={labelClass}>Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <input
              id="emailStatic"
              value={profile?.email ?? ""}
              disabled
              className={`${inputClass} cursor-not-allowed bg-gray-50 pl-11 text-gray-400`}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
        </div>

        <div className="mt-5">
          <label htmlFor="phone" className={labelClass}>Phone number</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className={`${inputClass} pl-11`}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Enugu"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>State</label>
            <select
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-600/15">
            {error}
          </p>
        )}
        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
            <CheckCircle className="h-4 w-4" />
            Profile updated successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#A0111C] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#A0111C]/20 transition-colors hover:bg-[#B41523] disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your information is kept private and secure.
        </p>
      </form>
    </div>
  );
}
