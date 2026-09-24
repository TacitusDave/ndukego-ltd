"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { MapPin, Network, Trees, ImageOff } from "lucide-react";
import { mediaUrl } from "@/lib/api";

export interface EstateCardData {
  id: string;
  name: string;
  state: string;
  city: string | null;
  shortDescription: string | null;
  totalPlots: number | null;
  availablePlots: number | null;
  coverImageUrl: string | null;
  masterPlanUrl?: string | null;
  buildingTypesConfig?: { id: string; name: string }[] | null;
  _count: { properties: number };
}

function EstateCover({
  src,
  alt,
  contain = false,
}: {
  src: string | null;
  alt: string;
  /** Site plans are diagrams — render them padded and uncropped. */
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Images can fail before hydration — re-check via the DOM on mount.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-emerald-950/[0.04]">
        <div className="text-center text-gray-400">
          <div className="h-10 w-10 mx-auto mb-1.5 rounded-full bg-gray-200/70 flex items-center justify-center">
            <ImageOff className="h-5 w-5" />
          </div>
          <p className="text-xs">No image yet</p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={mediaUrl(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={
        contain
          ? "w-full h-full object-contain p-3 bg-white group-hover:scale-[1.03] transition-transform duration-300"
          : "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      }
    />
  );
}

/**
 * Shared estate card — same visual language as PropertyCard but with its own
 * identity: the Sitemap icon carries the plots spec (available/total), the
 * badge is emerald "Estate", and there is no hover slideshow.
 */
export function EstateCard({ estate }: { estate: EstateCardData }) {
  const hasSitePlan =
    !!estate.masterPlanUrl || !!(estate.buildingTypesConfig && estate.buildingTypesConfig.length > 0);

  // The uploaded site plan IS estate imagery: when no cover photo exists,
  // show the plan itself as the card cover (padded, uncropped) so estates
  // never render a blank "No image yet" frame when a plan was uploaded.
  const coverSrc = estate.coverImageUrl ?? estate.masterPlanUrl ?? null;
  const coverIsPlan = !estate.coverImageUrl && !!estate.masterPlanUrl;

  return (
    <Link
      href={`/services/real-estate/estates/${estate.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_20px_44px_-20px_rgba(16,24,40,0.28)] hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        <EstateCover
          src={coverSrc}
          alt={coverIsPlan ? `Site plan — ${estate.name}` : estate.name}
          contain={coverIsPlan}
        />
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-lg bg-emerald-700/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            Estate
          </span>
        </div>
        {/* Site plan chip — surfaces the interactive master plan on every card. */}
        {hasSitePlan && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
              <Network className="h-3 w-3 text-emerald-700" />
              Site plan
            </span>
          </div>
        )}
        {estate.totalPlots != null && (
          <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {estate.availablePlots ?? 0}/{estate.totalPlots} plots
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-1 p-5">
        <p
          className="font-semibold text-[17px] text-gray-900 leading-snug line-clamp-1 group-hover:text-[#A0111C] transition-colors duration-150"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {estate.name}
        </p>

        <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {estate.city ? `${estate.city}, ` : ""}{estate.state}
          </span>
        </div>

        {estate.shortDescription && (
          <p className="mt-1 text-[13px] text-gray-500 leading-relaxed line-clamp-2">
            {estate.shortDescription}
          </p>
        )}

        {/* Sitemap spec row — the estate's unique signature */}
        <div className="mt-1.5 flex items-center gap-4 text-[13px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <Network className="h-4 w-4 text-emerald-600" />
            <span>
              <span className="font-semibold text-gray-800">{estate.availablePlots ?? 0}</span>
              {" / "}
              {estate.totalPlots ?? "—"} plots
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Trees className="h-4 w-4 text-gray-400" />
            {estate._count.properties} propert{estate._count.properties === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* Footer row mirrors the PropertyCard price row */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">
            Planned community
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 group-hover:text-[#A0111C] transition-colors">
            View Estate
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 transition-all group-hover:border-[#A0111C]/30 group-hover:bg-[#A0111C]/[0.06]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
