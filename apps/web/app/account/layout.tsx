import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth";
import { AccountNavLinks } from "./account-nav-links";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const firstName = session.user.firstName?.trim() || session.user.email.split("@")[0];
  const lastName = session.user.lastName?.trim() || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      {/* Soft brand wash behind the account area */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#A0111C]/[0.07] via-[#A0111C]/[0.02] to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Greeting header ── */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A0111C] to-[#7A0D15] text-lg font-bold text-white shadow-lg shadow-[#A0111C]/25"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {initials}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C]">My Account</p>
              <h1
                className="text-2xl font-bold text-gray-900 leading-tight sm:text-[1.7rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Welcome back, {firstName}
              </h1>
              <p className="text-sm text-gray-500">{fullName}</p>
            </div>
          </div>
        </header>

        {/* ── Body: sidebar + content ── */}
        <div className="flex flex-col gap-8 lg:flex-row">
          <AccountNavLinks email={session.user.email} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
