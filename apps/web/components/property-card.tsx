"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Bed, Bath, Maximize2, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { mediaUrl } from "@/lib/api";
import { FavoriteButton } from "@/components/favorite-button";

interface Media {
  url: string;
  isCover: boolean;
  type?: string;
}

interface Estate {
  name: string;
}

export interface PropertyCardData {
  id: string;
  title: string;
  status: string;
  category: string;
  type: string;
  state: string;
  city: string | null;
  listingPrice: string | null;
  landSize: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  latitude: string | null;
  longitude: string | null;
  media: Media[];
  estate: Estate | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  LAND: "Land",
  HOUSE: "House",
  DUPLEX: "Duplex",
  BUNGALOW: "Bungalow",
  APARTMENT: "Apartment",
  COMMERCIAL: "Commercial",
  WAREHOUSE: "Warehouse",
  OFFICE: "Office",
  SHOP: "Shop",
  HOTEL: "Hotel",
  ESTATE_PLOT: "Estate Plot",
  FARM_LAND: "Farm Land",
  MIXED_USE: "Mixed Use",
  INDUSTRIAL: "Industrial",
  LUXURY_HOME: "Luxury Home",
  PROJECT_DEVELOPMENT: "Project Dev",
};

const IMAGE_SLIDE_MS = 2500; // each photo shows for 2.5s
const VIDEO_SLIDE_MS = 10000; // each video plays its first 10s

/* ─────────────── Hover slideshow (property cards only) ─────────────── */

function MediaSlideshow({ media, alt }: { media: Media[]; alt: string }) {
  const usable = media.filter((m) => !!m.url);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 within current slide
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = (m: Media | undefined) =>
    !!m && (m.type === "VIDEO" || /\.(mp4|webm|mov)(\?|$)/i.test(m.url));

  const current = usable[index];
  const currentIsVideo = isVideo(current);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(usable.length, 1));
    setProgress(0);
  }, [usable.length]);

  // Drive the slide timing while hovered. Videos are kept muted + inline;
  // if a video fails/never plays we still advance after its window.
  useEffect(() => {
    if (!hovering || usable.length < 2) {
      clearTimers();
      return;
    }

    const el = videoRef.current;
    if (currentIsVideo && el) {
      el.currentTime = 0;
      el.muted = true;
      const p = el.play();
      if (p) p.catch(() => undefined);
    }

    startRef.current = performance.now();
    const duration = currentIsVideo ? VIDEO_SLIDE_MS : IMAGE_SLIDE_MS;

    const tick = (now: number) => {
      const frac = Math.min((now - startRef.current) / duration, 1);
      setProgress(frac);
      if (frac >= 1) {
        advance();
        return; // effect re-runs on index change
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovering, index, usable.length, currentIsVideo]);

  // Reset to cover when the pointer leaves
  const onEnter = () => {
    if (usable.length > 1) {
      setIndex(0);
      setProgress(0);
      setHovering(true);
    }
  };
  const onLeave = () => {
    setHovering(false);
    setIndex(0);
    setProgress(0);
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  };

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + usable.length) % usable.length);
    setProgress(0);
  };

  if (usable.length === 0 || imgFailed[0]) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground">
          <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <Maximize2 className="h-5 w-5" />
          </div>
          <p className="text-xs">No image yet</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Current slide */}
      {currentIsVideo ? (
        <video
          ref={videoRef}
          key={current!.url}
          src={mediaUrl(current!.url)}
          muted
          loop={false}
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current!.url}
          src={mediaUrl(current!.url)}
          alt={alt}
          onError={() => setImgFailed((f) => ({ ...f, [index]: true }))}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            hovering ? "scale-100" : "group-hover:scale-105",
          )}
        />
      )}

      {/* Arrows (desktop hover only) */}
      {hovering && usable.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(-1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Progress dots + counter */}
      {usable.length > 1 && (
        <>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {usable.map((_, i) => (
              <span
                key={i}
                className="relative h-1 w-4 overflow-hidden rounded-full bg-white/45"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }}
                />
              </span>
            ))}
          </div>
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
            {currentIsVideo && (
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <Play className="h-2.5 w-2.5 fill-current" /> Video
              </span>
            )}
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {index + 1}/{usable.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────── Card ──────────────────────────── */

export function PropertyCard({ property }: { property: PropertyCardData }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_20px_44px_-20px_rgba(16,24,40,0.28)] hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image + slideshow */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        <MediaSlideshow media={property.media} alt={property.title} />
        {/* Category tag — bottom-left of the photo */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="rounded-md bg-[#A0111C] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            {CATEGORY_LABEL[property.category] ?? property.category}
          </span>
        </div>
        {/* Bare overlay heart, as in the mockup — no chip behind it */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton propertyId={property.id} iconOnly variant="overlay" className="p-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-1 p-5">
        <p
          className="font-semibold text-[17px] text-gray-900 leading-snug line-clamp-1 group-hover:text-[#A0111C] transition-colors duration-150"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {property.title}
        </p>

        <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {property.city ? `${property.city}, ` : ""}{property.state}
          </span>
        </div>

        {/* Specs */}
        {(property.bedrooms != null || property.bathrooms != null || property.landSize) && (
          <div className="mt-1.5 flex items-center gap-4 text-[13px] text-gray-500">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1.5">
                <Bed className="h-4 w-4 text-gray-400" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1.5">
                <Bath className="h-4 w-4 text-gray-400" />
                {property.bathrooms}
              </span>
            )}
            {property.landSize && (
              <span className="flex items-center gap-1.5">
                <Maximize2 className="h-4 w-4 text-gray-400" />
                {property.landSize} sqm
              </span>
            )}
          </div>
        )}

        {/* Price + view */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          {property.listingPrice ? (
            <p className="text-xl font-bold text-[#A0111C] leading-none" style={{ fontFamily: "var(--font-display)" }}>
              {formatCurrency(property.listingPrice)}
            </p>
          ) : (
            <p className="text-sm text-gray-400 leading-none">Price on request</p>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 group-hover:text-[#A0111C] transition-colors">
            View Details
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 transition-all group-hover:border-[#A0111C]/30 group-hover:bg-[#A0111C]/[0.06]">
              <ChevronRight className="h-3 w-3" />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
