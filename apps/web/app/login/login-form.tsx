"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LogoIcon } from "@nhgp/assets";
import { webLogin } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await webLogin(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      const from = searchParams.get("from") ?? "/account";
      router.push(from);
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <LogoIcon width={64} height={64} />
        </div>

        {/* Form card */}
        <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Access your account to track reservations</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#A0111C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors duration-150 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#A0111C] font-medium hover:text-[#B41523] transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Are you staff?{" "}
          <a
            href="https://ndukego-investment-props-ltd-admin.vercel.app"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Use the admin portal
          </a>
        </p>
      </div>
    </div>
  );
}
