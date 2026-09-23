"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReveal } from "./reveal";

interface AnimateInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal wrapper. Deliberately understated: 14px rise + fade, short
 * duration, soft deceleration. Replaces the previous floaty 28px bounces —
 * the goal is enterprise-composed, not cartoonish.
 */
export function AnimateIn({ children, delay = 0, className }: AnimateInProps) {
  const reveal = useReveal(delay);

  return (
    <motion.div
      ref={reveal.ref}
      className={className}
      initial={reveal.initial}
      animate={reveal.animate}
      transition={reveal.transition}
    >
      {children}
    </motion.div>
  );
}
