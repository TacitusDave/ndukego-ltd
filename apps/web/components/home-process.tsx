"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

/* The journey is deliberately service-neutral: the same four steps carry a
   client through ANY of the company's services — real estate, LPO financing,
   investment financing, or consultancy. Placeholder artwork — swap the images
   for the real ones when ready. */
const STEPS = [
  {
    step: "01",
    title: "Book a Consultation",
    desc: "Reach out via phone, email, or our online form. Every engagement — property, financing, or investment — starts with a free discovery call.",
    image: "/Background2.png",
  },
  {
    step: "02",
    title: "Define Your Goals",
    desc: "We assess your finances, timeline, and risk appetite, then match you to the right service — buying land, LPO capital, or a structured investment.",
    image: "/Background3.png",
  },
  {
    step: "03",
    title: "Get a Tailored Plan",
    desc: "You receive clear, transparent options: verified listings, competitive financing terms, or an investment portfolio with a defined ROI timeline.",
    image: "/Background5.png",
  },
  {
    step: "04",
    title: "Execute & Close",
    desc: "We handle verification, documentation, and disbursement or handover — and our team stays with you long after the deal closes.",
    image: "/Background6.png",
  },
];

/**
 * "How it works" — the company-wide client journey, written to span all four
 * services (real estate, LPO financing, investment financing, consultancy).
 * On laptop and up this is a horizontal expanding-card accordion: the active
 * step grows into a giant card (number, text, photo below) while the other
 * steps collapse into slim columns showing just their number, a vertical
 * title, and a plus affordance. Clicking a collapsed step expands it and
 * closes the previously open one; step 01 is open by default. Tablet/mobile
 * keeps the original static grid.
 */
export function HomeProcess() {
  const [active, setActive] = useState("01");

  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      {/* Fixed crimson radial wash — static, no pulse loop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 50%, rgba(160,17,28,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">
            How It Works
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            One process, every service
          </h2>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Buying property, financing a contract, or growing capital — the
            journey is the same: consult, plan, verify, close.
          </p>
        </div>

        {/* ── Laptop+: expanding accordion ─────────────────────────────── */}
        <div className="hidden lg:flex h-[560px] gap-3">
          {STEPS.map((s) => {
            const isActive = active === s.step;
            return (
              <div
                key={s.step}
                role="button"
                tabIndex={0}
                aria-expanded={isActive}
                aria-label={`Step ${s.step}: ${s.title}`}
                onClick={() => setActive(s.step)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(s.step);
                  }
                }}
                style={{
                  flexGrow: isActive ? 5.4 : 0.7,
                  flexBasis: 0,
                  minWidth: 0,
                }}
                className={`group relative select-none overflow-hidden rounded border text-left outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[#A0111C]/40 ${
                  isActive
                    ? "border-[#A0111C]/15 bg-white "
                    : "cursor-pointer border-gray-100 bg-white/80 backdrop-blur-sm hover:border-[#A0111C]/20 hover:bg-white"
                }`}
              >
                {/* ── Collapsed face: number, vertical title, plus affordance ── */}
                <div
                  aria-hidden={isActive}
                  className={`absolute inset-0 flex flex-col items-center py-7 transition-opacity duration-300 ${
                    isActive ? "opacity-0" : "opacity-100 delay-150"
                  }`}
                >
                  <span className="text-4xl font-bold tabular-nums leading-none text-[#A0111C]">
                    {s.step}
                  </span>

                  <span className="flex flex-1 items-center justify-center py-4">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest text-gray-500"
                      style={{ writingMode: "vertical-rl" }}
                    >
                      {s.title}
                    </span>
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded border border-gray-200 text-gray-400 transition-colors duration-200 group-hover:border-[#A0111C]/30 group-hover:text-[#A0111C]">
                    <Plus className="h-4 w-4" />
                  </span>
                </div>

                {/* ── Expanded face: big number, text, photo below ── */}
                <div
                  aria-hidden={!isActive}
                  className={`absolute inset-0 flex flex-col p-8 xl:p-9 transition-opacity duration-500 ${
                    isActive
                      ? "opacity-100 delay-300"
                      : "pointer-events-none opacity-0"
                  }`}
                >
                  {/* Number and text share one level so the photo below
                      gets every remaining pixel of height. */}
                  <div className="flex items-start gap-5">
                    <span className="shrink-0 text-4xl xl:text-5xl font-bold tabular-nums leading-none text-[#A0111C]">
                      {s.step}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className="text-xl xl:text-2xl font-bold text-gray-900 leading-none"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {s.title}
                      </h3>
                      <p className="mt-2 max-w-md text-sm text-gray-500 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded ring-1 ring-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tablet/mobile: original static grid (unchanged) ───────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:hidden">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="group relative rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-6 h-full overflow-hidden shadow-sm hover:shadow-md hover:border-[#A0111C]/20 transition-all duration-300"
            >
              <p className="text-5xl font-bold tabular-nums mb-5 leading-none text-[#A0111C]">
                {step.step}
              </p>

              <h3 className="font-bold text-gray-900 mb-2.5 text-[15px]">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Static accent rule */}
        <div
          aria-hidden
          className="mt-10 h-px mx-auto max-w-2xl"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(160,17,28,0.35) 30%, rgba(160,17,28,0.12) 50%, rgba(160,17,28,0.35) 70%, transparent)",
          }}
        />
      </div>
    </section>
  );
}
