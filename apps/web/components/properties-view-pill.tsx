"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * One half of the List/Map toggle. Still a real <Link> (server navigation),
 * but the red selection pill is a shared `layoutId` element that glides
 * between the two buttons when the active side flips.
 */
export function PropertiesViewPill({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`relative flex flex-1 lg:flex-none items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
        active ? "text-white" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {active && (
        <motion.span
          layoutId="properties-view-pill"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="absolute inset-0 rounded-lg bg-[#A0111C] shadow-sm"
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </Link>
  );
}
