"use client";

import { usePathname } from "next/navigation";

/** Exact routes that render without the site footer. */
const FOOTERLESS_ROUTES = ["/login", "/register", "/properties"];

export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Exact matches…
  if (FOOTERLESS_ROUTES.includes(pathname)) return null;

  // …and route prefixes (the whole /account portal is footerless).
  if (pathname.startsWith("/account")) return null;

  return <>{children}</>;
}
