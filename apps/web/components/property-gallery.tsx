"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import { mediaUrl } from "@/lib/api";

interface Media {
  id: string;
  url: string;
  title: string | null;
  isCover: boolean;
  sortOrder: number;
}

interface PropertyGalleryProps {
  media: Media[];
  propertyTitle: string;
}

function GallerySlot({
  m,
  index,
  onOpen,
  extraCount,
  showOverlay,
}: {
  m: Media;
  index: number;
  onOpen: (i: number) => void;
  extraCount?: number;
  showOverlay?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Images can fail before hydration; re-check via the DOM on mount.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div
      onClick={() => onOpen(index)}
      className="relative overflow-hidden bg-gray-100 cursor-pointer"
    >
      {failed ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          <Images className="h-8 w-8 mb-1" />
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgRef}
          src={mediaUrl(m.url)}
          alt={m.title ?? `Photo ${index + 1}`}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
      {showOverlay && extraCount != null && extraCount > 0 && (
        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">+{extraCount}</span>
          <span className="text-sm text-white/75 mt-0.5 font-medium">more photos</span>
        </div>
      )}
    </div>
  );
}

export function PropertyGallery({ media, propertyTitle }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [heroFailed, setHeroFailed] = useState(false);
  const [mobileFailed, setMobileFailed] = useState(false);
  const heroRef = useRef<HTMLImageElement>(null);
  const mobileRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (el && el.complete && el.naturalWidth === 0) setHeroFailed(true);
    const mob = mobileRef.current;
    if (mob && mob.complete && mob.naturalWidth === 0) setMobileFailed(true);
  }, []);

  const total = media.length;

  const lbPrev = useCallback(() => setLightboxIndex((i) => (i - 1 + total) % total), [total]);
  const lbNext = useCallback(() => setLightboxIndex((i) => (i + 1) % total), [total]);
  const mobPrev = useCallback(() => setMobileIndex((i) => (i - 1 + total) % total), [total]);
  const mobNext = useCallback(() => setMobileIndex((i) => (i + 1) % total), [total]);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") lbPrev();
      if (e.key === "ArrowRight") lbNext();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, lbPrev, lbNext]);

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }
  function onTouchEnd(e: React.TouchEvent, prevFn: () => void, nextFn: () => void) {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextFn() : prevFn();
    setTouchStartX(null);
  }

  if (total === 0) return null;

  const extraCount = total - 3; // photos beyond the 3 shown in the grid

  return (
    <>
      {/* ── DESKTOP GRID (hidden on mobile) ─────────────────────── */}
      <div className="hidden md:block">
        {total === 1 && (
          <div
            className="relative overflow-hidden rounded-2xl bg-gray-100 cursor-pointer"
            style={{ height: 460 }}
            onClick={() => openLightbox(0)}
          >
            {heroFailed ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <Images className="h-10 w-10 mb-2" />
                <span className="text-sm">Image unavailable</span>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={heroRef}
                src={mediaUrl(media[0].url)}
                alt={propertyTitle}
                onError={() => setHeroFailed(true)}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {total === 2 && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden" style={{ height: 460 }}>
            <GallerySlot m={media[0]} index={0} onOpen={openLightbox} />
            <GallerySlot m={media[1]} index={1} onOpen={openLightbox} />
          </div>
        )}

        {total >= 3 && (
          <div className="grid grid-cols-3 grid-rows-2 gap-2 rounded-2xl overflow-hidden" style={{ height: 460 }}>
            {/* Cover: left, 2 rows */}
            <div className="col-span-2 row-span-2">
              <GallerySlot m={media[0]} index={0} onOpen={openLightbox} />
            </div>
            {/* Top-right */}
            <div className="col-span-1 row-span-1">
              <GallerySlot m={media[1]} index={1} onOpen={openLightbox} />
            </div>
            {/* Bottom-right — shows "+N more" overlay if there are extra photos */}
            <div className="col-span-1 row-span-1">
              <GallerySlot
                m={media[2]}
                index={2}
                onOpen={openLightbox}
                extraCount={extraCount > 0 ? extraCount : undefined}
                showOverlay={extraCount > 0}
              />
            </div>
          </div>
        )}

        {/* View all photos button */}
        {total > 1 && (
          <div className="flex justify-end mt-2.5">
            <button
              onClick={() => openLightbox(0)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm hover:border-[#A0111C]/30 hover:text-[#A0111C] transition-all"
            >
              <Images className="h-3.5 w-3.5" />
              View all {total} photo{total !== 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE SWIPEABLE (hidden on desktop) ────────────────── */}
      <div className="md:hidden">
        <div
          className="relative overflow-hidden rounded-2xl bg-gray-100"
          style={{ height: 280 }}
          onTouchStart={onTouchStart}
          onTouchEnd={(e) => onTouchEnd(e, mobPrev, mobNext)}
          onClick={() => openLightbox(mobileIndex)}
        >
          {mobileFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Images className="h-10 w-10 mb-2" />
              <span className="text-sm">Image unavailable</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={mobileRef}
              src={mediaUrl(media[mobileIndex].url)}
              alt={propertyTitle}
              onError={() => setMobileFailed(true)}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {total > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); mobPrev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); mobNext(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {total > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-white text-xs font-medium">
              {mobileIndex + 1} / {total}
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {total > 1 && total <= 10 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === mobileIndex ? "w-5 h-1.5 bg-[#A0111C]" : "w-1.5 h-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-4 z-10">
            <span className="text-white/50 text-sm font-medium">{propertyTitle}</span>
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-semibold tabular-nums">
                {lightboxIndex + 1} / {total}
              </span>
              <button
                aria-label="Close"
                onClick={() => setLightboxOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Prev */}
          {total > 1 && (
            <button
              aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); lbPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="px-16 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={(e) => onTouchEnd(e, lbPrev, lbNext)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={lightboxIndex}
              src={mediaUrl(media[lightboxIndex].url)}
              alt={media[lightboxIndex].title ?? propertyTitle}
              className="max-h-[75vh] max-w-[76vw] object-contain rounded-xl shadow-2xl"
            />
            {media[lightboxIndex].title && (
              <p className="mt-3 text-white/55 text-sm text-center">
                {media[lightboxIndex].title}
              </p>
            )}
          </div>

          {/* Next */}
          {total > 1 && (
            <button
              aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); lbNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Bottom thumbnail strip */}
          {total > 1 && (
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[85vw] pb-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Jump to photo ${i + 1}`}
                  className="shrink-0 rounded-lg overflow-hidden transition-opacity"
                  style={{
                    width: 60,
                    height: 42,
                    opacity: i === lightboxIndex ? 1 : 0.35,
                    boxShadow: i === lightboxIndex ? "inset 0 0 0 2.5px #fff" : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(m.url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
