import { publicFetch } from "@/lib/api";
import { AnimateIn } from "@/components/animate-in";
import { EstateCard, type EstateCardData } from "@/components/estate-card";

type Estate = EstateCardData;

interface EstatesResponse {
  items: Estate[];
  meta: { total: number };
}

/**
 * The full public estates catalogue — hero plus grid — designed to be embedded
 * as the estates section of the Real Estate service page. Fetches its own data
 * so the parent page stays lean.
 */
export async function EstateListing() {
  const { data } = await publicFetch<EstatesResponse>("/estates/public?limit=50");
  const estates = data?.items ?? [];

  return (
    <div>
      {/* Section header */}
      <div className="mb-12">
        <AnimateIn>
          <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-4">
            Our Estates
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight max-w-2xl mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Planned communities built for life.
          </h2>
          <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
            Every Ndukego estate is a fully planned community — with roads,
            drainage, power, security, and green spaces built in from the ground
            up.
          </p>
        </AnimateIn>
      </div>

      {/* Grid */}
      {estates.length === 0 ? (
        <AnimateIn>
          <div className="py-16 text-center rounded-2xl border border-gray-100 bg-white/70">
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
  );
}
