"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Crossfades the properties list ⇄ map views.
 *
 * Both views arrive as server-rendered nodes; this client component only
 * decides which one is shown and animates the handoff when the `view` prop
 * flips during navigation. `mode="wait"` keeps the swap deterministic —
 * the outgoing view leaves first (quick fade up), then the incoming one
 * settles in — so heights never fight and scroll stays anchored at the
 * filter ribbon.
 */
export function PropertiesViewTransition({
  view,
  list,
  map,
}: {
  view: "list" | "map";
  list: ReactNode;
  map: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {view === "map" ? map : list}
      </motion.div>
    </AnimatePresence>
  );
}
