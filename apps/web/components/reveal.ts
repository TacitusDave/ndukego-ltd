"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

/**
 * Shared reveal animation values — the single source of truth for how content
 * enters on scroll. Deliberately restrained: a quiet 14px rise with a gentle
 * deceleration, so pages feel composed rather than animated. Sections should
 * use this hook (directly or via <AnimateIn>) instead of hand-rolling
 * motion values.
 */
export function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  return {
    ref,
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: inView
      ? reduceMotion
        ? { opacity: 1 }
        : { opacity: 1, y: 0 }
      : undefined,
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
  };
}
