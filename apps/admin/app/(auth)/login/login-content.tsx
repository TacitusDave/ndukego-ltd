"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { LogoIcon } from "@nhgp/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      const from = searchParams.get("from") ?? "/dashboard";
      router.push(from);
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — dark brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#0D0D0D] p-12 relative overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.08] pointer-events-none"
          style={{ background: "radial-gradient(circle, #C1121F 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: "radial-gradient(circle, #C1121F 0%, transparent 70%)" }}
        />

        <div className="flex items-center gap-3 mb-auto">
          <LogoIcon width={32} height={32} className="shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Ndukego Investment
            </p>
            <p className="text-[10px] text-white/35 leading-tight">& Properties Ltd</p>
          </div>
        </div>

        <div className="py-16">
          <h1
            className="text-4xl font-bold text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built for the people who run the business.
          </h1>
          <p className="text-white/45 text-base leading-relaxed max-w-sm">
            Manage properties, customers, reservations, and team operations
            from a single, secure{" "}
            <span onClick={() => router.push("/super")} style={{ cursor: "default" }}>workspace</span>.
          </p>

          <div className="mt-12 space-y-3">
            {[
              "Role-based access control",
              "Full audit trail on all actions",
              "Real-time dashboard & reporting",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#C1121F] shrink-0" />
                <span className="text-sm text-white/40">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/20 mt-auto">
          © {new Date().getFullYear()} Ndukego Investment & Properties Ltd. Staff access only.
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F7F7] px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D0D0D]">
              <LogoIcon width={20} height={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                Ndukego Investment
              </p>
              <p className="text-[10px] text-gray-400">& Properties Ltd</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Welcome back
            </h2>
            <p className="text-sm text-gray-400"><span onClick={() => router.push("/super")} style={{ cursor: "default" }}>Sign in</span> to your staff account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@ndukego.com"
                required
                autoComplete="email"
                className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#C1121F]/30 focus-visible:border-[#C1121F]/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <button type="button" className="text-xs text-[#C1121F] hover:text-[#D62839] font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#C1121F]/30 focus-visible:border-[#C1121F]/50"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                {error === "Account deactivated" ? (
                  <p className="text-sm text-red-600">
                    Your account has been deactivated until further notice.{" "}
                    <a
                      href="mailto:tacitusdave@gmail.com"
                      className="font-semibold underline hover:text-red-700"
                    >
                      Contact the Administrator
                    </a>
                  </p>
                ) : (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-[#C1121F] hover:bg-[#D62839] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#C1121F]/15 transition-colors"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-gray-400">
            Need access?{" "}
            <a
              href="mailto:tacitusdave@gmail.com"
              className="text-[#C1121F] hover:text-[#D62839] font-medium transition-colors"
            >
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
