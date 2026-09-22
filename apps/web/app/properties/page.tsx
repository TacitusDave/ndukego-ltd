import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, LayoutGrid, Map, ChevronRight, Building2 } from "lucide-react";
import { publicFetch } from "@/lib/api";
import { PropertyCard, type PropertyCardData } from "@/components/property-card";
import type { MapProperty } from "@/components/properties-map-client";
import { PropertiesMapSection } from "@/components/properties-map-section";
import { PropertiesViewTransition } from "@/components/properties-view-transition";
import { PropertiesViewPill } from "@/components/properties-view-pill";
import { AnimateIn } from "@/components/animate-in";
import { HeroFlora } from "@/components/hero-flora";

export const metadata: Metadata = {
  title: "Properties",
  description: "Browse all available properties from Ndukego Homes Gallery.",
};

interface PropertiesResponse {
  items: PropertyCardData[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const PROPERTY_TYPES = [
  { value: "", label: "All types" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "AGRICULTURAL", label: "Agricultural" },
  { value: "MIXED_USE", label: "Mixed Use" },
];

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "HOUSE", label: "House" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "BUNGALOW", label: "Bungalow" },
  { value: "LUXURY_HOME", label: "Luxury Home" },
  { value: "LAND", label: "Land / Plot" },
  { value: "ESTATE_PLOT", label: "Estate Plot" },
  { value: "FARM_LAND", label: "Farm Land" },
  { value: "COMMERCIAL", label: "Commercial Space" },
  { value: "OFFICE", label: "Office" },
  { value: "SHOP", label: "Shop" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "HOTEL", label: "Hotel" },
  { value: "MIXED_USE", label: "Mixed Use" },
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function buildQueryString(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const merged = { ...base, ...overrides };
  return new URLSearchParams(
    Object.entries(merged).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
  ).toString();
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ?? "1";
  const search = params.search ?? "";
  const type = params.type ?? "";
  const category = params.category ?? "";
  const state = params.state ?? "";
  const estateId = params.estateId ?? "";
  const view = params.view ?? "list";

  const isMapView = view === "map";

  const query = new URLSearchParams({
    page: isMapView ? "1" : page,
    limit: isMapView ? "300" : "12",
  });
  if (search) query.set("search", search);
  if (type) query.set("type", type);
  if (category) query.set("category", category);
  if (state) query.set("state", state);
  if (estateId) query.set("estateId", estateId);

  const { data, error } = await publicFetch<PropertiesResponse>(
    `/properties/public?${query.toString()}`,
  );

  const items = data?.items ?? [];
  const meta = data?.meta;

  // Build map pins from items that have coordinates
  const mapPins: MapProperty[] = isMapView
    ? items
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          id: p.id,
          title: p.title,
          listingPrice: p.listingPrice,
          latitude: parseFloat(String(p.latitude)),
          longitude: parseFloat(String(p.longitude)),
          coverUrl: p.media.find((m) => m.isCover)?.url ?? p.media[0]?.url ?? null,
        }))
    : [];

  const filterBase = { search, type, category, state, estateId };

  const selectClass =
    "peer h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3.5 pr-9 text-sm text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#A0111C]/25 focus:border-[#A0111C]";

  return (
    <>
      {/* ── Hero — split-screen: text left, house bleeding into the cream
          background and reaching the right screen edge (no frame) ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f6f1e7] via-[#f4ecdf] to-[#efe6d4]">
        <HeroFlora />

        {/* Full-height house image, right half, blended left edge (desktop) */}
        <div
          aria-hidden
          className="pointer-events-none hidden lg:block absolute inset-y-0 right-0 w-[52%]"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url(/properties-hero-house.png)",
              maskImage: "linear-gradient(to right, transparent 0%, black 32%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 32%)",
              filter: "saturate(1.04)",
            }}
          />
          {/* Warm wash so the photo melts into the cream band */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #f4ecdf 0%, rgba(244,236,223,0.25) 30%, rgba(244,236,223,0) 55%), linear-gradient(to top, rgba(239,230,212,0.5) 0%, rgba(239,230,212,0) 35%)",
            }}
          />
        </div>

        {/* Mobile/tablet image — below the text, soft-blended, no frame */}
        <div className="relative lg:hidden px-4 sm:px-6 pb-2">
          <div
            aria-hidden
            className="absolute inset-x-4 -top-10 h-24 bg-gradient-to-b from-[#f6f1e7] to-transparent z-10 pointer-events-none"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/properties-hero-house.png"
            alt="Modern luxury home at sunset with palm trees and landscaped garden"
            className="w-full h-56 sm:h-72 object-cover rounded-[1.75rem]"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0%, black 14%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%)",
            }}
          />
        </div>

        <div className="relative">
          <div className="w-full lg:w-[48%] px-4 pb-4 pt-10 sm:px-6 sm:pt-12 lg:py-14 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-10">
            {/* Text — unchanged copy */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ndukego Homes
            </h1>
            <p className="text-sm text-gray-400 mb-5">
              Powered By: <span className="font-semibold text-gray-600">Ndukego Investment &amp; Properties Ltd</span>
            </p>
            <span className="inline-block h-1 w-25 bg-[#A0111C] mb-5" />
            <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
              Curated selection of residential, commercial, and investment properties
              across Nigeria. Each listing verified for quality and authenticity.
            </p>
          </div>
        </div>

        {/* Vertical side note — far right, over the image (desktop) */}
        <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 xl:flex flex-col items-center gap-3">
          <span className="h-10 w-px bg-gray-500/40" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-600 [writing-mode:vertical-rl]">
            Better Homes &middot; Bigger Futures
          </span>
          <span className="h-10 w-px bg-gray-500/40" />
        </div>
      </section>

      {/* ── Filter ribbon — floating rounded card, sticky under navbar.
          Grid stack on phone/tablet, single row on desktop. ── */}
      <section className="sticky top-16 z-40 py-3 px-4 sm:px-6 lg:px-8 -mt-1">
        <div className="mx-auto max-w-7xl">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_minmax(160px,1fr)_auto_auto_auto_auto_auto] lg:items-center rounded-xl border border-gray-200/80 bg-white/90 p-3.5 shadow-[0_18px_40px_-24px_rgba(16,24,40,0.35)] backdrop-blur-md">
            <div className="hidden lg:flex items-center gap-2 pl-1 pr-1 text-sm text-gray-700 shrink-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A0111C]/[0.08]">
                <SlidersHorizontal className="h-4 w-4 text-[#A0111C]" />
              </span>
              <span className="font-semibold">Filters</span>
            </div>

            {/* Search */}
            <label className="relative w-full sm:col-span-2 lg:col-span-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Search by location, title, or property ID..."
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A0111C]/25 focus:border-[#A0111C] transition-all"
              />
            </label>

            {/* Property Type */}
            <label className="relative block w-full">
              <span className="pointer-events-none absolute -top-2 left-3 z-10 rounded bg-white px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Property Type
              </span>
              <select name="type" defaultValue={type} className={selectClass}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 rotate-90 -translate-y-1/2 text-gray-400" />
            </label>

            {/* Category */}
            <label className="relative block w-full">
              <span className="pointer-events-none absolute -top-2 left-3 z-10 rounded bg-white px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Category
              </span>
              <select name="category" defaultValue={category} className={selectClass}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 rotate-90 -translate-y-1/2 text-gray-400" />
            </label>

            {/* Location */}
            <label className="relative block w-full">
              <span className="pointer-events-none absolute -top-2 left-3 z-10 rounded bg-white px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Location
              </span>
              <select name="state" defaultValue={state} className={selectClass}>
                <option value="">All states</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 rotate-90 -translate-y-1/2 text-gray-400" />
            </label>

            {/* Keep view param when submitting filters */}
            {isMapView && <input type="hidden" name="view" value="map" />}

            {/* Apply + Clear — own full-width row on phone/tablet */}
            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1 lg:col-start-6">
              <button
                type="submit"
                className="h-11 flex-1 lg:flex-none rounded-lg bg-[#A0111C] px-5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm shadow-[#A0111C]/25"
              >
                Apply Filters
              </button>

              {(search || type || category || state) && (
                <Link
                  href={`/properties${isMapView ? "?view=map" : ""}`}
                  className="h-11 flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-500 hover:text-[#A0111C] hover:border-[#A0111C]/40 transition-colors"
                >
                  Clear
                </Link>
              )}
            </div>

            {/* View toggle — full-width row on phone/tablet, right-aligned on desktop.
                layoutId makes the red selection pill glide between List and Map. */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:col-span-2 lg:col-span-1 lg:col-start-7 lg:justify-self-end">
              <PropertiesViewPill active={!isMapView} href={`/properties?${buildQueryString(filterBase, { view: "list", page: "1" })}`}>
                <LayoutGrid className="h-3.5 w-3.5" />
                List
              </PropertiesViewPill>
              <PropertiesViewPill active={isMapView} href={`/properties?${buildQueryString(filterBase, { view: "map" })}`}>
                <Map className="h-3.5 w-3.5" />
                Map
              </PropertiesViewPill>
            </div>
          </form>
        </div>
      </section>

      {/* List ⇄ Map — crossfaded handoff during navigation */}
      <PropertiesViewTransition
        view={isMapView ? "map" : "list"}
        map={<PropertiesMapSection mapPins={mapPins} error={error} />}
        list={
          <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 mb-8 flex items-center gap-3">
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Failed to load properties. Please try again.
              </div>
            )}

            {!error && items.length === 0 && (
              <div className="py-24 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Try adjusting your search or filters to find what you&apos;re looking for.
                </p>
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#A0111C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors"
                >
                  Clear all filters
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {items.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-900">{items.length}</span> of{" "}
                    <span className="font-semibold text-gray-900">{meta?.total ?? 0}</span> properties
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                  {items.map((p, idx) => (
                    <AnimateIn key={p.id} delay={idx * 0.05}>
                      <PropertyCard property={p} />
                    </AnimateIn>
                  ))}
                </div>

                {/* Pagination - refined */}
                {meta && meta.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    {meta.page > 1 && (
                      <Link
                        href={`/properties?${buildQueryString(filterBase, { page: String(meta.page - 1) })}`}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        Previous
                      </Link>
                    )}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Link
                            key={pageNum}
                            href={`/properties?${buildQueryString(filterBase, { page: String(pageNum) })}`}
                            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                              meta.page === pageNum
                                ? "bg-[#A0111C] text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                    </div>
                    {meta.page < meta.totalPages && (
                      <Link
                        href={`/properties?${buildQueryString(filterBase, { page: String(meta.page + 1) })}`}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        }
      />
    </>
  );
}
