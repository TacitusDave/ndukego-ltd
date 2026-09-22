"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    title: "Book a Consultation",
    desc: "Reach out via phone, email, or our online form. Our team will schedule a free discovery call.",
  },
  {
    step: "02",
    title: "Define Your Goals",
    desc: "We assess your financial situation, property needs, and investment horizon to craft a tailored plan.",
  },
  {
    step: "03",
    title: "Select & Verify",
    desc: "We present verified opportunities. Every property listing passes our title and inspection checklist.",
  },
  {
    step: "04",
    title: "Close with Confidence",
    desc: "We walk you through the entire transaction — documentation, legal sign-off, and handover.",
  },
];

export function HomeProcess() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Crimson radial pulse — gives this section its signature glow on the light bg */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 50%, rgba(160,17,28,0.10) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Scan beam (subtle on light bg) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 w-56"
        style={{
          background: "linear-gradient(to right, transparent, rgba(160,17,28,0.04), transparent)",
        }}
        animate={{ x: ["-240px", "calc(100vw + 240px)"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
      />

      {/* Outer ring pulse */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        animate={{ opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div
          className="w-[560px] h-[560px] max-w-[150vw] max-h-[150vw] rounded-full border border-[#A0111C]/15"
          style={{ boxShadow: "0 0 80px 0 rgba(160,17,28,0.06)" }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="mb-16 max-w-xl"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">
            How It Works
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            From first call to final handover
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative">
              {i < STEPS.length - 1 && (
                <motion.div
                  className="hidden lg:block absolute top-[2.25rem] left-full z-10 h-px"
                  style={{
                    width: "calc(100% + 1.25rem)",
                    background: "linear-gradient(to right, rgba(160,17,28,0.5), rgba(160,17,28,0.08))",
                  }}
                  initial={{ scaleX: 0, originX: "left" }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5 + i * 0.22, duration: 0.55, ease: "easeOut" }}
                />
              )}

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.16, duration: 0.6, ease: "easeOut" }}
                className="group relative rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-6 h-full overflow-hidden shadow-sm hover:shadow-md hover:border-[#A0111C]/20 transition-all duration-300"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(160,17,28,0.07) 0%, transparent 70%)",
                  }}
                />

                <motion.p
                  className="text-5xl font-bold tabular-nums mb-5 leading-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(160,17,28,0.55) 0%, rgba(160,17,28,0.12) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.16, duration: 0.5 }}
                >
                  {step.step}
                </motion.p>

                <h3 className="font-bold text-gray-900 mb-2.5 text-[15px]">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Pulsing accent line */}
        <motion.div
          className="mt-12 h-px mx-auto max-w-2xl"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(160,17,28,0.4) 30%, rgba(160,17,28,0.15) 50%, rgba(160,17,28,0.4) 70%, transparent)",
          }}
          animate={{ opacity: [0.35, 0.85, 0.35], scaleX: [0.85, 1, 0.85] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </section>
  );
}
