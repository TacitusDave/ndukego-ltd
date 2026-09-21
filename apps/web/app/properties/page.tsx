import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, LayoutGrid, Map, ChevronRight, MapPin, Bed, Bath, Maximize2, Building2 } from "lucide-react";
import { publicFetch } from "@/lib/api";
import { PropertyCard, type PropertyCardData } from "@/components/property-card";
import type { MapProperty } from "@/components/properties-map-client";
import { PropertiesMapSection } from "@/components/properties-map-section";
import { AnimateIn } from "@/components/animate-in";

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

  return (
    <>
      {/* Page header - elegant dark header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#A0111C]/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ndukego Homes
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Powered By: <span className="font-semibold text-gray-600">Ndukego Investment &amp; Properties Ltd</span>
            </p>
            <p className="text-lg text-gray-500 leading-relaxed">
              Curated selection of residential, commercial, and investment properties
              across Nigeria. Each listing verified for quality and authenticity.
            </p>
          </div>
        </div>
      </section>

      {/* Filters + View toggle - refined styling */}
      <section className="sticky top-16 z-40 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <form className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-[#A0111C]" />
              <span className="font-medium">Filter</span>
            </div>

            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by location, title..."
              className="h-10 flex-1 min-w-[200px] max-w-[300px] border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#A0111C]/20 focus:border-[#A0111C] transition-all"
            />

            <select
              name="type"
              defaultValue={type}
              className="h-10 border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A0111C]/20 focus:border-[#A0111C] transition-all"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              name="category"
              defaultValue={category}
              className="h-10 border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A0111C]/20 focus:border-[#A0111C] transition-all"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              name="state"
              defaultValue={state}
              className="h-10 border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A0111C]/20 focus:border-[#A0111C] transition-all"
            >
              <option value="">All states</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Keep view param when submitting filters */}
            {isMapView && <input type="hidden" name="view" value="map" />}

            <button
              type="submit"
              className="h-10 rounded bg-[#A0111C] px-5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm"
            >
              Apply Filters
            </button>

            {(search || type || category || state) && (
              <Link
                href={`/properties${isMapView ? "?view=map" : ""}`}
                className="h-10 flex items-center rounded px-4 text-sm text-gray-500 hover:text-[#A0111C] hover:border-[#A0111C] border border-transparent transition-all"
              >
                Clear
              </Link>
            )}

            {/* View toggle */}
            <div className="ml-auto flex items-center gap-1 rounded border border-gray-200 bg-white p-0.5 shadow-sm">
              <Link
                href={`/properties?${buildQueryString(filterBase, { view: "list", page: "1" })}`}
                className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  !isMapView
                    ? "bg-[#A0111C] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                List
              </Link>
              <Link
                href={`/properties?${buildQueryString(filterBase, { view: "map" })}`}
                className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isMapView
                    ? "bg-[#A0111C] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Map className="h-3.5 w-3.5" />
                Map
              </Link>
            </div>
          </form>
        </div>
      </section>

      {/* MAP VIEW */}
      {isMapView && <PropertiesMapSection mapPins={mapPins} error={error} />}

      {/* LIST VIEW - Elegant card design */}
      {!isMapView && (
        <section className="py-12">
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
                  Try adjusting your search or filters to find what you're looking for.
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
      )}
    </>
  );
}
