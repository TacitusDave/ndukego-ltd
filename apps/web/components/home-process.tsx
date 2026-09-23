"use client";

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

/**
 * "How it works" — deliberately static presentation. The previous version ran
 * looping scan beams, pulsing rings, and pulsing accent lines simultaneously;
 * constant motion reads as unserious for an enterprise brand. Content now
 * enters once with the shared restrained reveal and then holds still.
 */
export function HomeProcess() {
  return (
    <section className="relative py-28 overflow-hidden">
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
        <div className="mb-16 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">
            How It Works
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            From first call to final handover
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="group relative rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-6 h-full overflow-hidden shadow-sm hover:shadow-md hover:border-[#A0111C]/20 transition-all duration-300"
            >
              <p
                className="text-5xl font-bold tabular-nums mb-5 leading-none"
                style={{
                  background: "linear-gradient(135deg, rgba(160,17,28,0.55) 0%, rgba(160,17,28,0.12) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {step.step}
              </p>

              <h3 className="font-bold text-gray-900 mb-2.5 text-[15px]">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Static accent rule */}
        <div
          aria-hidden
          className="mt-12 h-px mx-auto max-w-2xl"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(160,17,28,0.35) 30%, rgba(160,17,28,0.12) 50%, rgba(160,17,28,0.35) 70%, transparent)",
          }}
        />
      </div>
    </section>
  );
}
