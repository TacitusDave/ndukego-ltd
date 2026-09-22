"use client";

import { usePathname } from "next/navigation";

/** Exact routes that render without the site footer. */
const FOOTERLESS_ROUTES = ["/login", "/register"];

/** Route prefixes (with their sub-pages) that render without the footer. */
const FOOTERLESS_PREFIXES = ["/properties", "/account"];

export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Exact matches…
  if (FOOTERLESS_ROUTES.includes(pathname)) return null;

  // …and route prefixes — /properties covers the listing page AND every
  // property detail page (/properties/[id]); /account covers the portal.
  if (FOOTERLESS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  return <>{children}</>;
}
