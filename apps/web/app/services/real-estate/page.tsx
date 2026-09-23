import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Home, Building, MapPin, Layers } from "lucide-react";
import { publicFetch } from "@/lib/api";
import { AnimateIn } from "@/components/animate-in";
import { PosterList } from "@/components/posters";
import { PropertyCard, type PropertyCardData } from "@/components/property-card";
import { EstateCard } from "@/components/estate-card";

export const metadata: Metadata = {
  title: "Real Estate",
  description: "Verified residential, commercial, and land listings across Nigeria. Every property is title-checked and inspection-cleared by Ndukego Investment & Properties Ltd.",
};

interface Estate {
  id: string;
  name: string;
  state: string;
  city: string | null;
  shortDescription: string | null;
  totalPlots: number | null;
  availablePlots: number | null;
  coverImageUrl: string | null;
  masterPlanUrl: string | null;
  buildingTypesConfig: { id: string; name: string }[] | null;
  _count: { properties: number };
}

interface EstatesResponse {
  items: Estate[];
  meta: { total: number };
}

interface PropertiesResponse {
  items: PropertyCardData[];
  meta: { total: number };
}

const OFFERINGS = [
  {
    icon: Home,
    title: "Residential Properties",
    desc: "Homes, apartments, duplexes, bungalows, and luxury residences for buyers and renters across Nigeria's key markets.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Building,
    title: "Commercial Properties",
    desc: "Office spaces, shops, warehouses, and mixed-use developments strategically located for maximum business exposure.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: MapPin,
    title: "Land Acquisition",
    desc: "Serviced plots, agricultural land, and prime parcels with verified titles and clear ownership history.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Layers,
    title: "Estate Development",
    desc: "Planned estates with blocks, phases, and shared infrastructure ideal for investors seeking long-term capital growth.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default async function RealEstatePage() {
  const [propertiesRes, estatesRes] = await Promise.all([
    publicFetch<PropertiesResponse>("/properties/public?featured=true&limit=6"),
    publicFetch<EstatesResponse>("/estates/public?featured=true&limit=4"),
  ]);

  const featuredProperties = propertiesRes.data?.items ?? [];
  const featuredEstates = estatesRes.data?.items ?? [];

  return (
    <>
      {/* Hero */}
      <section className="relative py-24 pt-28">
        <div className="absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-4">Real Estate</p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Find your property. Own it with confidence.
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
              Every listing on Ndukego Homes has passed our title verification and physical
              inspection process, because the biggest financial decision of your life deserves
              that level of certainty.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 rounded bg-[#A0111C] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm shadow-[#A0111C]/15"
              >
                Browse Properties <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/contact?message=${encodeURIComponent("Hi, I'm interested in your real estate services and would like to speak with an agent.")}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Talk to Us
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* What we offer */}
      <section className="relative py-20 bg-white/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">What We Cover</p>
            <h2
              className="text-3xl font-bold text-gray-900 mb-12"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every kind of real estate, one trusted team
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OFFERINGS.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimateIn key={item.title} delay={i * 0.07}>
                  <div className="border border-gray-100 bg-white/80 p-6 shadow-sm">
                    <div className={`inline-flex h-10 w-10 items-center justify-center ${item.bg} mb-4`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured properties ───────────────────── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">
                  Featured Listings
                </p>
                <h2
                  className="text-3xl font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {featuredProperties.length > 0 ? "Handpicked properties for you" : "Available properties"}
                </h2>
              </div>
              <Link
                href="/properties"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#A0111C] hover:text-[#B41523] transition-colors"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </AnimateIn>

          {featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((p, i) => (
                <AnimateIn key={p.id} delay={i * 0.07}>
                  <PropertyCard property={p} />
                </AnimateIn>
              ))}
            </div>
          ) : (
            <AnimateIn delay={0.1}>
              <div className="rounded-2xl border border-gray-100 bg-white/70 p-16 text-center shadow-sm">
                <Building className="h-10 w-10 mx-auto text-gray-300 mb-4" />
                <p className="font-semibold text-gray-600">Listings coming soon</p>
                <p className="text-sm text-gray-400 mt-2">
                  We&apos;re adding new verified properties. Check back shortly.
                </p>
              </div>
            </AnimateIn>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 rounded bg-[#A0111C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors"
            >
              View all properties <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured estates ──────────────────────── */}
      {featuredEstates.length > 0 && (
        <section className="relative py-20 bg-white/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateIn>
              <div className="flex items-end justify-between mb-12">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">
                    Our Estates
                  </p>
                  <h2
                    className="text-3xl font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Planned communities to call home
                  </h2>
                </div>
                <Link
                  href="/estates"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#A0111C] hover:text-[#B41523] transition-colors"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </AnimateIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {featuredEstates.map((e, i) => (
                <AnimateIn key={e.id} delay={i * 0.1}>
                  <EstateCard estate={e} />
                </AnimateIn>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/estates"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Explore all estates <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Posters Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">Marketing Materials</p>
                <h2
                  className="text-3xl font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  See Our Posters
                </h2>
                <p className="text-gray-500 mt-2 max-w-xl">
                  Explore our latest property posters and marketing materials showcasing featured listings and developments.
                </p>
              </div>
            </div>
          </AnimateIn>
          <PosterList />
        </div>
      </section>

      {/* Trust signals */}
      <section className="relative py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateIn>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">Why Ndukego</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>
                The Ndukego standard
              </h2>
              <div className="space-y-4">
                {[
                  "Title-verified listings C of O, Survey Plans, Deed of Assignment confirmed before listing",
                  "In-house inspection team accompanies every site visit",
                  "No hidden charges - transparent pricing from day one",
                  "Legal support through documentation and conveyancing",
                  "Post-handover support for new owners",
                  "Licensed and experienced professionals with 10+ years in Nigerian real estate",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-[#A0111C] mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">{point}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>

            <AnimateIn delay={0.12}>
              <div className=" border border-gray-200 bg-white p-8 shadow-sm space-y-5">
                <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                  Start your property search
                </h3>
                <p className="text-sm text-gray-500">
                  Browse our full catalogue of verified listings or speak to our team for a
                  guided search tailored to your budget and goals.
                </p>
                <Link
                  href="/properties"
                  className="block text-center rounded bg-[#A0111C] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors"
                >
                  Browse All Properties
                </Link>
                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-300" />
                  <span className="text-xs text-gray-400">Or</span>
                  <div className="h-px flex-1 bg-gray-300" />
                </div>
                <Link
                  href={`/contact?message=${encodeURIComponent("Hi, I'm interested in your real estate services and would like to speak with an agent.")}`}
                  className="block text-center rounded border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Speak to an Agent
                </Link>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>
    </>
  );
}
