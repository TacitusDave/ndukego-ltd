import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, LineChart, BookOpen, Globe, Target } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";

export const metadata: Metadata = {
  title: "Investment Consultancy",
  description: "Expert financial advisory, portfolio analysis, and market intelligence. Ndukego Investment & Properties Ltd helps you make smarter investment decisions.",
};

const SERVICES = [
  {
    icon: Target,
    title: "Financial Goal Setting",
    desc: "We work with you to define clear, measurable financial objectives, whether that's building a property portfolio, funding retirement, or growing business capital.",
  },
  {
    icon: LineChart,
    title: "Portfolio Analysis",
    desc: "We review your existing Investment, identify gaps and risks, and propose adjustments to align your holdings with your long-term goals.",
  },
  {
    icon: Globe,
    title: "Market Intelligence",
    desc: "Real-time insight on Nigerian property markets, emerging investment corridors, and economic factors affecting your returns.",
  },
  {
    icon: BookOpen,
    title: "Financial Education",
    desc: "We believe informed clients make better decisions. We walk you through every option, term, and risk; no jargon, no pressure.",
  },
];

const WHO_WE_SERVE = [
  "Individuals building personal wealth from savings or salary",
  "Entrepreneurs reinvesting business profits",
  "Diaspora Nigerians seeking to invest back home safely",
  "Families planning for generational wealth transfer",
  "Corporations with surplus capital seeking asset-backed returns",
  "First-time investors unfamiliar with the Nigerian market",
];

const PROCESS = [
  { step: "01", title: "Discovery Call", desc: "A free 30-minute session to understand your financial situation, goals, and timeline." },
  { step: "02", title: "Analysis & Strategy", desc: "We assess your current position and prepare a tailored investment roadmap with specific recommendations." },
  { step: "03", title: "Proposal Review", desc: "We walk you through the strategy together, every recommendation is explained and any option can be adjusted." },
  { step: "04", title: "Ongoing Advisory", desc: "For retained clients, we provide quarterly reviews, market updates, and portfolio rebalancing as needed." },
];

export default function InvestmentConsultancyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-4">Investment Consultancy</p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Clarity for every financial decision.
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
              Expert guidance, honest analysis, and market intelligence — from advisors who
              understand both global principles and Nigeria&apos;s unique investment landscape.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/contact?message=${encodeURIComponent("Hi, I'd like to book a session with your advisors.")}`}
                className="inline-flex items-center gap-2 rounded bg-[#A0111C] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm shadow-[#A0111C]/15"
              >
                Book a Session <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* What we do */}
      <section className="relative py-20 bg-white/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">What We Do</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12" style={{ fontFamily: "var(--font-display)" }}>
              Advisory that goes beyond a single product
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <AnimateIn key={svc.title} delay={i * 0.07}>
                  <div className="flex gap-5 border border-gray-100 bg-white/80 p-6 shadow-sm h-full">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A0111C]/8">
                      <Icon className="h-5 w-5 text-[#A0111C]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">{svc.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
                    </div>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">Our Process</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12" style={{ fontFamily: "var(--font-display)" }}>
              How we work with you
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROCESS.map((step, i) => (
              <AnimateIn key={step.step} delay={i * 0.08}>
                <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm h-full">
                  <p
                    className="text-4xl font-bold mb-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(160,17,28,0.55), rgba(160,17,28,0.12))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {step.step}
                  </p>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Who we serve + CTA */}
      <section className="relative py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <AnimateIn>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">Who We Serve</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "var(--font-display)" }}>
                Built for everyone building wealth
              </h2>
              <div className="space-y-3">
                {WHO_WE_SERVE.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-[#A0111C] mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>
            <AnimateIn delay={0.12}>
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  Book a session
                </h3>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                  No commitment. No sales pressure. Just an honest conversation about your
                  financial goals and how we can help you reach them.
                </p>
                <Link
                  href={`/contact?message=${encodeURIComponent("Hi, I'd like to book a session with your advisors.")}`}
                  className="block text-center rounded bg-[#A0111C] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors mb-3"
                >
                  Book a Session
                </Link>
                <p className="text-center text-xs text-gray-400">
                  Or email: ndukegoinvest.propertiesltd@gmail.com
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>
    </>
  );
}
