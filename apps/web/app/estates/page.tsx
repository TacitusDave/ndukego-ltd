import type { Metadata } from "next";
import { publicFetch } from "@/lib/api";
import { AnimateIn } from "@/components/animate-in";
import { EstateCard, type EstateCardData } from "@/components/estate-card";

export const metadata: Metadata = {
  title: "Our Estates",
  description: "Planned communities and residential developments by Ndukego Investment & Properties Ltd.",
};

type Estate = EstateCardData;

interface EstatesResponse {
  items: Estate[];
  meta: { total: number };
}

export default async function EstatesPage() {
  const { data } = await publicFetch<EstatesResponse>("/estates/public?limit=50");
  const estates = data?.items ?? [];

  return (
    <>
      {/* Hero */}
      <section className="relative py-24 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-4">Estates</p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-2xl mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Planned communities built for life.
            </h1>
            <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
              Every Ndukego estate is a fully planned community — with roads, drainage,
              power, security, and green spaces built in from the ground up.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Grid */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {estates.length === 0 ? (
            <AnimateIn>
              <div className="py-20 text-center rounded-2xl border border-gray-100 bg-white/70">
                <p className="text-gray-400 text-sm">No estates listed yet. Check back soon.</p>
              </div>
            </AnimateIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estates.map((e, i) => (
                <AnimateIn key={e.id} delay={i * 0.06}>
                  {/* Shared card — shows the cover photo, or the uploaded site
                      plan when no cover photo exists. */}
                  <EstateCard estate={e} />
                </AnimateIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
