import type { Metadata } from "next";
import { AnimateIn } from "@/components/animate-in";
import { GalleryList } from "@/components/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos, videos, posters, and collages from Ndukego Investment & Properties Ltd — site tours, launches, and marketing materials.",
};

export default function GalleryPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-4">
              Gallery
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-2xl mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              See our work, everywhere we show up.
            </h1>
            <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
              Site tours, estate launches, marketing posters, and moments from
              across the company — all in one place.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Gallery */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GalleryList />
        </div>
      </section>
    </>
  );
}
