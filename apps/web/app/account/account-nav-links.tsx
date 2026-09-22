"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Heart, User, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { webLogout } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/account", icon: LayoutDashboard, exact: true },
  { label: "My Reservations", href: "/account/reservations", icon: CalendarCheck },
  { label: "Saved Properties", href: "/account/favorites", icon: Heart },
  { label: "Profile & Settings", href: "/account/profile", icon: User },
];

export function AccountNavLinks({ email }: { email: string }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  return (
    <aside className="lg:sticky lg:top-24 lg:w-72 lg:shrink-0 lg:self-start">
      <div className="rounded-3xl border border-black/[0.06] bg-white/80 p-4 shadow-sm shadow-black/[0.03] backdrop-blur">
        {/* Identity card */}
        <div className="mb-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 px-5 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Signed in as</p>
          <p className="mt-1 truncate text-sm font-semibold">{email}</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#A0111C] text-white shadow-md shadow-[#A0111C]/25"
                    : "text-gray-600 hover:bg-[#A0111C]/[0.06] hover:text-[#A0111C]",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-[#A0111C]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="mt-4 border-t border-black/[0.06] pt-4">
          <form action={webLogout} onSubmit={() => setPending(true)}>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 shrink-0" />}
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
