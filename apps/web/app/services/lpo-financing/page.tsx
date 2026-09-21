import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, FileText, BadgeCheck, Banknote, RefreshCw } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";

export const metadata: Metadata = {
  title: "LPO Financing",
  description: "Fast working capital against your Local Purchase Orders and government contracts. Quick approval, competitive terms — Ndukego Investment & Properties Ltd.",
};

const STEPS = [
  { icon: FileText, step: "01", title: "Submit Your LPO", desc: "Provide us with your Local Purchase Order, company registration documents, and bank statements." },
  { icon: BadgeCheck, step: "02", title: "Assessment & Approval", desc: "Our team reviews the LPO authenticity, contract terms, and your repayment capacity — typically within 48 hours." },
  { icon: Banknote, step: "03", title: "Funds Disbursed", desc: "Approved financing is transferred directly to your business account so you can fulfill the contract on time." },
  { icon: RefreshCw, step: "04", title: "Repayment", desc: "Repay from the proceeds of your contract payment — structured to match your contract's payment timeline." },
];

const QUALIFIES = [
  "Registered businesses with valid government or corporate LPOs",
  "Contractors, vendors, and suppliers to federal, state, or local government agencies",
  "First-time applicants with verifiable contracts",
  "Businesses with a track record of contract execution",
];

const BENEFITS = [
  "No need to wait months for contract payments — get funded now",
  "Competitive interest rates tailored to contract size",
  "Fast turnaround — decisions in 24–48 hours",
  "No collateral required for most qualifying LPOs",
  "Confidential and professional handling of your contracts",
];

export default function LpoFinancingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-4">LPO Financing</p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your contract is your capital.
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
              Don&apos;t let cash flow gaps stop you from executing government or corporate contracts.
              We finance the gap so you can deliver and profit.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/contact?message=${encodeURIComponent("Hi, I have an LPO and would like to apply for LPO financing. Please contact me to discuss.")}`}
                className="inline-flex items-center gap-2 rounded bg-[#A0111C] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm shadow-[#A0111C]/15"
              >
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/contact?message=${encodeURIComponent("Hi, I have a question about LPO financing.")}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Ask a Question
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* What is LPO Financing */}
      <section className="relative py-20 bg-white/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <AnimateIn>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">What Is It?</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-5" style={{ fontFamily: "var(--font-display)" }}>
                LPO Financing explained simply
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                A Local Purchase Order (LPO) is a formal commitment from a government body or
                large corporation to purchase goods or services from your business. It&apos;s
                valuable but it doesn&apos;t pay your suppliers or staff today.
              </p>
              <p className="text-gray-500 leading-relaxed">
                LPO Financing means we advance you the capital you need to execute the contract
                now. When the buyer pays you, you repay us. Simple, fast, and structured around
                how your business actually works.
              </p>
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-7">
                <p className="text-sm font-bold text-blue-700 mb-4 uppercase tracking-widest">Who Qualifies</p>
                <div className="space-y-3">
                  {QUALIFIES.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">How It Works</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12" style={{ fontFamily: "var(--font-display)" }}>
              Four steps from contract to cash
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <AnimateIn key={step.step} delay={i * 0.08}>
                  <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#A0111C]/8">
                        <Icon className="h-4 w-4 text-[#A0111C]" />
                      </div>
                      <span
                        className="text-3xl font-bold"
                        style={{
                          background: "linear-gradient(135deg, rgba(160,17,28,0.55), rgba(160,17,28,0.12))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {step.step}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits + CTA */}
      <section className="relative py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <AnimateIn>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">Benefits</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "var(--font-display)" }}>
                Why choose Ndukego for LPO financing
              </h2>
              <div className="space-y-4">
                {BENEFITS.map((b) => (
                  <div key={b} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-[#A0111C] mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">{b}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>

            <AnimateIn delay={0.12}>
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  Ready to apply?
                </h3>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                  Contact our team with your LPO details and we&apos;ll get back to you within
                  24 hours with a financing offer.
                </p>
                <Link
                  href={`/contact?message=${encodeURIComponent("Hi, I have an LPO and would like to apply for LPO financing. Please contact me to discuss.")}`}
                  className="block text-center rounded-xl bg-[#A0111C] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors mb-3"
                >
                  Submit Your LPO
                </Link>
                <p className="text-center text-xs text-gray-400">Or call us: +234 803 609 6700</p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>
    </>
  );
}
