"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User, Phone, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@nhgp/assets";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Real Estate", href: "/services/real-estate" },
      { label: "LPO Financing", href: "/services/lpo-financing" },
      { label: "Investment Financing", href: "/services/investment-financing" },
      { label: "Investment Consultancy", href: "/services/investment-consultancy" },
    ],
  },
  { label: "Properties", href: "/properties" },
  { label: "Estates", href: "/estates" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

interface MenuSessionUser {
  firstName: string;
  email: string;
}

/** Read the non-httpOnly session-hint cookie the web app sets on login. */
function readSessionUser(): MenuSessionUser | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("web_user_info="));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      decodeURIComponent(raw.slice("web_user_info=".length)),
    ) as { firstName?: string | null; email?: string };
    if (!parsed?.email) return null;
    return {
      firstName: parsed.firstName?.trim() || parsed.email.split("@")[0],
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<MenuSessionUser | null>(null);

  useEffect(() => {
    setSessionUser(readSessionUser());
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  // The bar is permanently solid (the same style it used to adopt when the
  // menu opened) so the menu panel always unfolds from a matching surface.
  return (
    <>
      {/* ── Bar (stays fixed; the menu panel anchors to its bottom edge) ── */}
      <header
        className="fixed top-0 left-0 right-0 z-[70] border-b border-black/[0.06] bg-white/95 shadow-[0_12px_32px_-24px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between relative">

            {/* LEFT — brand mark (bare logo, no pill) */}
            <Link
              href="/"
              onClick={close}
              aria-label="Ndukego Investment & Properties — Home"
              className="group flex h-10 items-center gap-2.5"
            >
              <LogoIcon
                width={36}
                height={36}
                className="shrink-0 transition-transform duration-300 ease-out group-hover:scale-[1.06]"
              />
              <span
                className="text-[11px] font-bold leading-tight text-gray-900 sm:block hidden whitespace-nowrap uppercase tracking-widest"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Ndukego Investment &amp; Properties Ltd
              </span>
            </Link>

            {/* CENTRE — quick actions (desktop) */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 lg:flex">
              <Link
                href="/contact"
                title="Call or contact us"
                aria-label="Call or contact us"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-[#A0111C]/[0.08] hover:text-[#A0111C]"
              >
                <Phone className="h-[16px] w-[16px]" />
              </Link>
              <span aria-hidden className="mx-2 h-4 w-px bg-black/10" />
              {sessionUser ? (
                <Link
                  href="/account"
                  title="My Account"
                  className="flex h-9 items-center gap-2 rounded-full bg-gray-900 pl-3 pr-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#A0111C]"
                >
                  <User className="h-4 w-4 opacity-80" />
                  <span className="max-w-[140px] truncate">{sessionUser.firstName}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex h-9 items-center gap-2 rounded-xl bg-gray-500 border border-gray-400 px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 "
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* RIGHT — sign in (mobile) + menu toggle */}
            <div className="z-10 flex items-center gap-1.5">
              {sessionUser ? (
                <Link
                  href="/account"
                  title="My Account"
                  aria-label="My Account"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:bg-gray-900/[0.05] hover:text-gray-900 lg:hidden"
                >
                  <User className="h-[17px] w-[17px]" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex h-9 items-center rounded-full bg-gray-900 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#A0111C] lg:hidden"
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/contact"
                title="Call or contact us"
                aria-label="Call or contact us"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:bg-[#A0111C]/[0.08] hover:text-[#A0111C] lg:hidden"
              >
                <Phone className="h-[16px] w-[16px]" />
              </Link>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-900 transition-colors duration-200 hover:bg-gray-900/[0.05]"
              >
                {/* Simultaneous crossfade — both glyphs stacked, no swap delay */}
                <Menu
                  className={cn(
                    "absolute h-5 w-5 transition-all duration-300",
                    menuOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
                  )}
                />
                <X
                  className={cn(
                    "absolute h-5 w-5 transition-all duration-300",
                    menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0",
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Menu overlay: the navbar itself is the header — the panel clips
          out from directly beneath it, so nothing shifts or jumps. ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[55] bg-black/25 backdrop-blur-[2px]"
              onClick={close}
            />

            {/* Panel — flush under the 64px bar on every breakpoint; internal
                column scrolls independently so no nav item is ever unreachable
                on short screens. */}
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
              exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
              transition={{ duration: 0.45, ease: EASE }}
              className="fixed inset-x-0 top-16 bottom-0 z-[60] overflow-hidden rounded-b-3xl bg-white shadow-[0_32px_64px_-32px_rgba(0,0,0,0.35)]"
            >
              <div className="h-full overflow-y-auto overscroll-contain">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-12 pt-8 sm:px-8 sm:pt-10 lg:grid-cols-[1fr_320px] lg:gap-14">

                  {/* Primary links */}
                  <nav className="divide-y divide-black/[0.05]">
                    {NAV_LINKS.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8, transition: { duration: 0.15, ease: "easeIn" } }}
                        transition={{ duration: 0.5, ease: EASE, delay: 0.08 + i * 0.04 }}
                        className={link.children ? "py-4" : undefined}
                      >
                        {link.children ? (
                          <>
                            <div className="flex items-center gap-4">
                              <span className="w-5 shrink-0 text-[11px] tabular-nums text-gray-300">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <Link
                                href={link.href}
                                onClick={close}
                                className={cn(
                                  "text-lg font-semibold transition-colors",
                                  isActive(link.href) ? "text-[#A0111C]" : "text-gray-900 hover:text-[#A0111C]",
                                )}
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                {link.label}
                              </Link>
                            </div>
                            <div className="ml-9 mt-2 flex flex-wrap gap-2">
                              {link.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={close}
                                  className={cn(
                                    "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-150",
                                    isActive(child.href)
                                      ? "border-[#A0111C]/30 bg-[#A0111C]/[0.06] font-semibold text-[#A0111C]"
                                      : "border-black/[0.08] bg-white text-gray-500 hover:border-[#A0111C]/25 hover:text-[#A0111C]",
                                  )}
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </>
                        ) : (
                          <Link
                            href={link.href}
                            onClick={close}
                            className={cn(
                              "group flex items-center gap-4 py-4 transition-colors",
                              isActive(link.href) ? "text-[#A0111C]" : "text-gray-900 hover:text-[#A0111C]",
                            )}
                          >
                            <span className="w-5 shrink-0 text-[11px] tabular-nums text-gray-300">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span
                              className="text-lg font-semibold"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {link.label}
                            </span>
                            <ArrowRight className="ml-auto h-4 w-4 text-gray-200 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#A0111C]" />
                          </Link>
                        )}
                      </motion.div>
                    ))}
                  </nav>

                  {/* Side rail */}
                  <motion.aside
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.08 + NAV_LINKS.length * 0.04 }}
                    className="flex flex-col gap-5 rounded-3xl bg-[#F7F5F2] p-6"
                  >
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Call us
                      </p>
                      <a
                        href="tel:+2348036096700"
                        className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900 transition-colors hover:text-[#A0111C]"
                      >
                        <Phone className="h-4 w-4 text-[#A0111C]" />
                        +234 803 609 6700
                      </a>
                      <a
                        href="tel:+2347052955555"
                        className="mt-1 ml-6 text-sm text-gray-500 transition-colors hover:text-[#A0111C]"
                      >
                        +234 705 295 5555
                      </a>
                    </div>
                    <div className="h-px bg-black/[0.06]" />
                    <div className="flex flex-col gap-2.5">
                      <Link
                        href="/properties"
                        onClick={close}
                        className="flex items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#A0111C]"
                      >
                        Browse Properties
                      </Link>
                      <Link
                        href="/contact"
                        onClick={close}
                        className="flex items-center justify-center gap-2 rounded-full border border-[#A0111C]/25 bg-white px-5 py-3 text-sm font-semibold text-[#A0111C] transition-colors hover:bg-[#A0111C]/[0.06]"
                      >
                        Book Consultation
                      </Link>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-400">
                      Available Mon–Fri, 8 am – 6 pm WAT. Our team responds within one business day.
                    </p>
                  </motion.aside>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
