"use client";

import { motion } from "framer-motion";

/**
 * Decorative flower / foliage accents for the properties hero — soft,
 * slow-drifting shapes anchored to the section edges (mirrors the mockup's
 * botanical corners). Purely decorative; aria-hidden.
 */
export function HeroFlora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft blurred foliage blobs */}
      <motion.div
        className="absolute -left-24 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[#A0111C]/10 blur-3xl"
        animate={{ y: [0, -14, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-[#C04550]/10 blur-3xl"
        animate={{ y: [0, 12, 0], opacity: [1, 0.7, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />
      <motion.div
        className="absolute -right-10 top-6 h-48 w-48 rounded-full bg-[#A0111C]/[0.07] blur-3xl"
        animate={{ y: [0, 10, 0], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />

      {/* Leaf sprigs — left edge */}
      <svg
        className="absolute -left-3 top-1/2 hidden h-56 w-40 -translate-y-1/2 text-[#A0111C]/15 lg:block"
        viewBox="0 0 160 220"
        fill="currentColor"
      >
        <motion.g
          animate={{ rotate: [0, 3, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "0px", originY: "110px" }}
        >
          <path d="M8 110 C40 70, 90 60, 130 78 C96 96, 52 104, 8 110 Z" opacity="0.5" />
          <path d="M8 130 C44 100, 96 94, 140 108 C104 124, 56 132, 8 130 Z" opacity="0.35" />
          <path d="M10 92 C38 62, 78 52, 116 62 C86 80, 48 88, 10 92 Z" opacity="0.3" />
        </motion.g>
      </svg>

      {/* Flower cluster — bottom-left corner */}
      <svg
        className="absolute -bottom-4 left-2 hidden h-32 w-32 text-[#A0111C]/20 lg:block"
        viewBox="0 0 120 120"
        fill="currentColor"
      >
        <motion.g
          animate={{ rotate: [0, -4, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "10px", originY: "110px" }}
        >
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse
              key={deg}
              cx="60"
              cy="34"
              rx="11"
              ry="22"
              opacity="0.55"
              transform={`rotate(${deg} 60 60)`}
            />
          ))}
          <circle cx="60" cy="60" r="10" fill="#7a0d15" opacity="0.45" />
        </motion.g>
      </svg>

      {/* Stem + leaves — bottom-right of the text block */}
      <svg
        className="absolute bottom-0 left-[38%] hidden h-28 w-40 text-[#A0111C]/12 xl:block"
        viewBox="0 0 160 100"
        fill="currentColor"
      >
        <motion.g
          animate={{ rotate: [0, 2, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "80px", originY: "100px" }}
        >
          <path d="M80 100 C78 66, 82 40, 92 18" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path d="M84 70 C64 62, 52 48, 54 32 C72 40, 82 54, 84 70 Z" opacity="0.6" />
          <path d="M86 52 C104 46, 114 34, 114 20 C98 26, 88 38, 86 52 Z" opacity="0.45" />
        </motion.g>
      </svg>
    </div>
  );
}
