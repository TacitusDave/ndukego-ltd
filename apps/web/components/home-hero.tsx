"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

/* ── Slideshow ─────────────────────────────────────────────
   Background1 always opens each cycle; 2-6 follow in a new
   random order every cycle (unchanged behavior).
──────────────────────────────────────────────────────────── */
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
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

export function HomeHero({ totalProperties }: { totalProperties: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const [sequence, setSequence] = useState<number[]>(() => generateSequence());
  const [idx, setIdx] = useState(0);
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => {
        const next = prev + 1;
        if (next >= sequenceRef.current.length) {
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#faf7f1] via-[#f7f2e9] to-[#f2ebdd] lg:flex lg:min-h-[calc(100svh-64px)]">

      {/* Decorative background wash (text side only on desktop) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(45% 50% at 8% 85%, rgba(93,122,95,0.07) 0%, transparent 60%), radial-gradient(40% 40% at 30% 10%, rgba(160,17,28,0.04) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] lg:w-1/2"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── LEFT — all text, search, CTAs, stats ── */}
      <div className="relative z-10 w-full lg:w-[48%]">
        <div className="w-full px-4 pb-2 pt-10 sm:px-6 sm:pt-12 lg:py-10 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-10 xl:pr-14">

          {/* Eyebrow label */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-4">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#A0111C]/70">
              Nigeria&apos;s Premier Property &amp; Investment Group
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 leading-[1.06] mb-4"
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
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed mb-6"
          >
            Ndukego Investment &amp; Properties Ltd delivers verified real estate,
            LPO financing, investment capital, and expert consultancy all under one roof.
          </motion.p>

          {/* Search bar */}
          <motion.form
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            onSubmit={handleSearch}
            className="flex gap-2 max-w-xl mb-6"
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
              className="rounded-xl bg-[#A0111C] px-5 sm:px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shrink-0 shadow-sm"
            >
              Search
            </button>
          </motion.form>

          {/* CTA buttons */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center gap-4 mb-7"
          >
            <Link
              href="/properties"
              className="inline-flex items-center gap-2.5 rounded border border-gray-300 bg-white/90 px-6 py-3.5 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-white transition-all shadow-sm"
            >
              Browse Properties <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/contact?message=${encodeURIComponent("Hi, I'd like to book a session with your team.")}`}
              className="inline-flex items-center gap-2.5 rounded bg-[#A0111C] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm shadow-[#A0111C]/20"
            >
              Book a Session
            </Link>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center gap-6 sm:gap-10 pt-5 border-t border-gray-200/80 lg:justify-between"
          >
            {[
              { value: totalProperties > 0 ? `${totalProperties}+` : "50+", label: "Verified Listings" },
              { value: "10+", label: "Years in Nigeria" },
              { value: "₦500M+", label: "Properties Transacted" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT — slideshow: stacked below the text on small screens,
          full-height bleed to the right screen edge on desktop ── */}
      <div className="relative mt-10 pb-12 lg:pb-0 lg:mt-0 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[52%]">
        {/* Mobile/tablet keeps the framed card; desktop bleeds edge-to-edge */}
        <div className="relative mx-4 overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-32px_rgba(93,64,28,0.45)] ring-1 ring-black/10 sm:mx-6 lg:m-0 lg:h-full lg:rounded-none lg:shadow-none lg:ring-0">
          <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full">

            <AnimatePresence mode="sync">
              <motion.div
                key={currentBg}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
                aria-hidden
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${currentBg}')` }}
              />
            </AnimatePresence>

            {/* Legibility + warmth wash */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10"
            />

            {/* Blend the image's left edge into the background (desktop) */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 hidden w-44 bg-gradient-to-r from-[#faf7f1] via-[#faf7f1]/35 to-transparent lg:block"
            />

            {/* Caption + indicators */}
            <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex items-end justify-between gap-3">
              <div>
                <p
                  className="text-white font-semibold text-sm sm:text-base drop-shadow-sm"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Featured homes &amp; developments
                </p>
                <p className="text-white/80 text-[11px] sm:text-xs mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Verified &amp; inspection-cleared
                </p>
              </div>
              <div className="flex items-center gap-1.5 pb-1">
                {sequence.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
