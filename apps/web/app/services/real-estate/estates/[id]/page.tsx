import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight, Building2 } from "lucide-react";
import { publicFetch } from "@/lib/api";
import { EstateSitePlan, type DynamicBuildingType } from "@/components/estate-site-plan";
import { AnimateIn } from "@/components/animate-in";
import { PropertyAmenities } from "@/components/property-amenities";

interface Estate {
  id: string;
  name: string;
  code: string;
  slug: string;
  status: string;
  state: string;
  city: string | null;
  address: string | null;
  description: string | null;
  shortDescription: string | null;
  totalPlots: number | null;
  availablePlots: number | null;
  totalLandSize: number | null;
  masterPlanUrl: string | null;
  buildingTypesConfig: DynamicBuildingType[] | null;
  amenities: string[];
  mapUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  phases: { id: string; name: string; code: string; totalPlots: number | null }[];
  _count?: { properties: number };
}

function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data } = await publicFetch<{ items: Estate[] }>(`/estates/public?limit=500`);
  const estate = data?.items?.find((e) => e.id === id);
  if (!estate) return { title: "Estate Not Found" };
  return {
    title: estate.name,
    description: estate.shortDescription ?? `${estate.name} — ${estate.city ?? ""} ${estate.state}`.trim(),
  };
}

export default async function EstateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch all public estates and find the one matching id
  const { data } = await publicFetch<{ items: Estate[] }>(`/estates/public?limit=500`);
  const estate = data?.items?.find((e) => e.id === id);

  if (!estate) notFound();

  function getMapEmbedUrl(): string | null {
    let lat: number | null = null;
    let lng: number | null = null;

    if (estate!.latitude && estate!.longitude) {
      lat = parseFloat(String(estate!.latitude));
      lng = parseFloat(String(estate!.longitude));
    } else if (estate!.mapUrl) {
      const coords = extractCoordsFromUrl(estate!.mapUrl);
      if (coords) { lat = coords.lat; lng = coords.lng; }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return null;
    const d = 0.004;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  }

  const mapEmbedUrl = getMapEmbedUrl();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-24 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <Link
                href="/services/real-estate"
                className="text-xs font-bold uppercase tracking-widest text-[#C1121F] hover:underline"
              >
                Real Estate
              </Link>
              <span className="text-xs text-gray-300">/</span>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Estate
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {estate.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-400 mb-6">
              <MapPin className="h-4 w-4 text-[#C1121F] shrink-0" />
              <span className="text-sm">
                {estate.city ? `${estate.city}, ` : ""}{estate.state}
                {estate.address ? ` — ${estate.address}` : ""}
              </span>
            </div>
            {estate.shortDescription && (
              <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
                {estate.shortDescription}
              </p>
            )}
          </AnimateIn>

          {/* Stats strip */}
          <AnimateIn delay={0.1}>
            <div className="flex flex-wrap gap-10 mt-10 pt-8 border-t border-gray-200">
              {estate.totalPlots && (
                <div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {estate.totalPlots.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Total Plots</p>
                </div>
              )}
              {estate.availablePlots != null && (
                <div>
                  <p className="text-2xl font-bold text-[#C1121F] tabular-nums">
                    {estate.availablePlots.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Available</p>
                </div>
              )}
              {estate.totalLandSize && (
                <div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {Number(estate.totalLandSize).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">sqm Total</p>
                </div>
              )}
              {estate.phases.length > 0 && (
                <div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {estate.phases.length}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Phase{estate.phases.length !== 1 ? "s" : ""}</p>
                </div>
              )}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Description ──────────────────────────────────────── */}
      {estate.description && (
        <section className="relative py-12 bg-white/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateIn>
              <p className="text-gray-600 leading-relaxed max-w-3xl text-base">
                {estate.description}
              </p>
            </AnimateIn>
          </div>
        </section>
      )}

      {/* ── Amenities ────────────────────────────────────────── */}
      {estate.amenities && estate.amenities.length > 0 && (
        <section className="relative py-12 bg-white/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateIn>
              <p className="text-xs font-bold uppercase tracking-widest text-[#C1121F] mb-3">
                Facilities
              </p>
              <h2
                className="text-2xl font-bold text-gray-900 mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Estate Amenities
              </h2>
              <PropertyAmenities amenities={estate.amenities} label="Available at this estate" />
            </AnimateIn>
          </div>
        </section>
      )}

      {/* ── Location Map ─────────────────────────────────────── */}
      {mapEmbedUrl && (
        <section className="relative py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateIn>
              <p className="text-xs font-bold uppercase tracking-widest text-[#C1121F] mb-3">
                Location
              </p>
              <h2
                className="text-2xl font-bold text-gray-900 mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Find us on the map
              </h2>
              <div className="rounded-2xl overflow-hidden border border-gray-200 h-80">
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Estate location map"
                />
              </div>
              {(estate.latitude && estate.longitude) || estate.mapUrl ? (
                <a
                  href={
                    estate.mapUrl ??
                    `https://www.google.com/maps?q=${estate.latitude},${estate.longitude}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-[#C1121F] hover:underline"
                >
                  Open in Google Maps →
                </a>
              ) : null}
            </AnimateIn>
          </div>
        </section>
      )}

      {/* ── Interactive Site Plan (requires an uploaded master plan) ── */}
      {estate.masterPlanUrl ? (
        <section className="relative py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateIn>
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-[#C1121F] mb-3">
                  Site Plan
                </p>
                <h2
                  className="text-3xl font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Explore the estate layout
                </h2>
                <p className="text-gray-400 mt-2 text-sm">
                  Pan and zoom to navigate. Click any coloured plot to see its building prototype and details.
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <EstateSitePlan
                sitePlanUrl={estate.masterPlanUrl}
                buildingTypes={estate.buildingTypesConfig}
              />
            </AnimateIn>
          </div>
        </section>
      ) : null}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative py-16 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2
              className="text-2xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to secure your plot?
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm">
              Contact us today to discuss plot availability, pricing, and payment plans
              for {estate.name}.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/contact?message=${encodeURIComponent(`Hi, I'm interested in ${estate.name} and would like to book a consultation.`)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#C1121F] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#D62839] transition-colors shadow-sm shadow-[#C1121F]/15"
              >
                Book a Consultation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/properties?estateId=${estate.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <Building2 className="h-4 w-4" />
                View Listed Properties
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
