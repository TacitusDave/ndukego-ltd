"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

/* ── Background image slideshow ─────────────────────────
   Background1 is always first in every cycle.
   Backgrounds 2-6 follow in a new random order each cycle.
───────────────────────────────────────────────────────── */
function generateSequence(): number[] {
  const rest = [2, 3, 4, 5, 6];
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [1, ...rest];
}

const INTERVAL_MS = 5500;
const FADE_MS = 1400;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.11, duration: 0.65, ease: "easeOut" as const },
  }),
};

export function HomeHero({ totalProperties }: { totalProperties: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  /* Slideshow state */
  const [sequence, setSequence] = useState<number[]>(() => generateSequence());
  const [idx, setIdx] = useState(0);
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => {
        const next = prev + 1;
        if (next >= sequenceRef.current.length) {
          // New random order for backgrounds 2-6, bg1 always restarts
          setSequence(generateSequence());
          return 0;
        }
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const currentBg = `/Background${sequence[idx]}.png`;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/properties${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <section className="-mt-16 relative min-h-screen flex items-center overflow-hidden">

      {/* ── Background image slideshow ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
          aria-hidden
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url('${currentBg}')` }}
        />
      </AnimatePresence>

      {/* Overlay — softens images for text legibility while keeping them visible */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.65) 100%)",
        }}
      />

      {/* Subtle grid on top of images (matches global grid aesthetic) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Content — CENTERED ── */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-20 sm:pt-28 pb-28 text-center">

        {/* Eyebrow label */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="mb-8"
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#A0111C]/70">
            Nigeria&apos;s Premier Property &amp; Investment Group
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.04] mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Build Wealth.<br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #A0111C 0%, #C41826 50%, #A0111C 100%)" }}
          >
            Own Property.
          </span>
          <br />
          Grow Capital.
        </motion.h1>

        {/* Subheading */}
        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Ndukego Investment &amp; Properties Ltd delivers verified real estate,
          LPO financing, investment capital, and expert consultancy all under one roof.
        </motion.p>

        {/* Search bar — centered */}
        <motion.form
          custom={3} variants={fadeUp} initial="hidden" animate="show"
          onSubmit={handleSearch}
          className="flex gap-2 max-w-xl mx-auto mb-8"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search by location, title, or type…"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A0111C]/25 focus:border-[#A0111C]/40 transition-all"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#A0111C] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shrink-0 shadow-sm"
          >
            Search
          </button>
        </motion.form>

        {/* CTA buttons — centered, with generous gap */}
        <motion.div
          custom={4} variants={fadeUp} initial="hidden" animate="show"
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        >
          <Link
            href="/properties"
            className="inline-flex items-center gap-2.5 rounded border border-gray-300 bg-white/90 px-8 py-3.5 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-white transition-all shadow-sm"
          >
            Browse Properties <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/contact?message=${encodeURIComponent("Hi, I'd like to book a session with your team.")}`}
            className="inline-flex items-center gap-2.5 rounded bg-[#A0111C] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm shadow-[#A0111C]/20"
          >
            Book a Session
          </Link>
        </motion.div>

        {/* Stat strip — centered */}
        <motion.div
          custom={5} variants={fadeUp} initial="hidden" animate="show"
          className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-8 border-t border-gray-200/80 max-w-2xl mx-auto"
        >
          {[
            { value: totalProperties > 0 ? `${totalProperties}+` : "50+", label: "Verified Listings" },
            { value: "10+", label: "Years in Nigeria" },
            { value: "₦500M+", label: "Properties Transacted" },
            { value: "4", label: "Service Lines" },
          ].map((stat) => (
            <div key={stat.label} className="text-center space-y-0.5">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stat.value}</p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
