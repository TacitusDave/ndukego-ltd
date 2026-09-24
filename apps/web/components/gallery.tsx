"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImageOff,
  ExternalLink,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Link2,
  Check,
  Maximize2,
  Film,
  Play,
} from "lucide-react";
import { fetchGalleryItems, mediaUrl, type PublicGalleryItem } from "@/lib/api";

/* ─── Type helper ────────────────────────────────────────────────────────── */

function kindOf(item: PublicGalleryItem): "IMAGE" | "VIDEO" | "COLLAGE" {
  if (item.type === "VIDEO" || item.type === "COLLAGE") return item.type;
  if (item.type === "IMAGE") return "IMAGE";
  // Legacy poster rows: any webm/mp4/mov path is a video, otherwise image.
  if (item.imageUrl && /\.(mp4|webm|mov)(\?|$)/i.test(item.imageUrl)) return "VIDEO";
  return "IMAGE";
}

/* ─── Dimension helpers ─────────────────────────────────────────────────── */

/** Human label like "A4 · 2480×3508" — shown as a chip on each card. */
function dimensionLabel(p: PublicGalleryItem): string | null {
  if (!p.width || !p.height) return null;
  const w = p.width;
  const h = p.height;
  // Near-A4 at 300dpi (2480×3508 ±2%)
  const isA4P = Math.abs(w - 2480) / 2480 < 0.02 && Math.abs(h - 3508) / 3508 < 0.02;
  const isA4L = Math.abs(w - 3508) / 3508 < 0.02 && Math.abs(h - 2480) / 2480 < 0.02;
  if (isA4P) return "A4 Portrait";
  if (isA4L) return "A4 Landscape";
  return `${w}×${h}`;
}

/**
 * One shared aspect ratio per group so every row stays perfectly aligned.
 * If all items in the group share the same shape (±2%), use it; otherwise
 * fall back to a portrait frame and crop outliers with object-cover.
 */
function groupAspect(ps: PublicGalleryItem[]): string {
  const sized = ps.filter((p) => p.width && p.height);
  if (sized.length === 0) return "4 / 5";
  const w = sized[0].width!;
  const h = sized[0].height!;
  const r = w / h;
  const uniform = sized.every((p) => Math.abs(p.width! / p.height! - r) / r < 0.02);
  return uniform ? `${w} / ${h}` : "4 / 5";
}

/**
 * Column plan that grows with the item count — 1 to 5 per row — with
 * responsive caps so laptop shows the full density while mobile stays
 * readable (1–2 across).
 */
function gridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2 sm:grid-cols-3";
  if (count === 4) return "grid-cols-2 sm:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
}

/* ─── Placeholder ───────────────────────────────────────────────────────── */

function GalleryPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <ImageOff className="h-10 w-10 text-gray-400" />
    </div>
  );
}

/* ─── Lightbox ──────────────────────────────────────────────────────────── */

function GalleryLightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: PublicGalleryItem[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const item = items[index];
  const kind = item ? kindOf(item) : "IMAGE";
  const isVideo = kind === "VIDEO";
  const [zoomed, setZoomed] = useState(false);
  const [copied, setCopied] = useState<"link" | "share" | null>(null);
  const [loaded, setLoaded] = useState(false);
  const mediaRef = useRef<HTMLImageElement>(null);

  const videoSrc = isVideo ? mediaUrl(item.posterFrameUrl ?? item.mediaUrl ?? item.imageUrl) : "";
  const frameSrc = isVideo && item.posterFrameUrl ? mediaUrl(item.posterFrameUrl) : "";
  const imageSrc = !isVideo ? mediaUrl(item.imageUrl) : "";

  const go = useCallback(
    (dir: 1 | -1) => {
      if (items.length < 2) return;
      setZoomed(false);
      setLoaded(false);
      onNavigate((index + dir + items.length) % items.length);
    },
    [index, items.length, onNavigate],
  );

  // Keyboard: Esc closes, arrows navigate.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!item) return null;

  async function handleDownload() {
    const src = isVideo ? videoSrc : imageSrc;
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        (item.title ? item.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() : "gallery-item") +
        (src.match(/\.\w+$/) ? src.match(/\.\w+$/)![0] : isVideo ? ".mp4" : ".png");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(isVideo ? videoSrc : imageSrc, "_blank");
    }
  }

  async function handleShare() {
    const shareData = {
      title: item.title ?? "Ndukego gallery",
      text: item.description ?? undefined,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user cancelled — fall through */
      }
    }
    await handleCopy();
    setCopied("share");
    setTimeout(() => setCopied(null), 1800);
  }

  async function handleCopy() {
    const src = isVideo ? videoSrc : imageSrc;
    try {
      await navigator.clipboard.writeText(src.startsWith("http") ? src : `${window.location.origin}${src}`);
      setCopied("link");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-black/92 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title ?? "Gallery preview"}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 text-white shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {item.title ?? "Untitled"}
            {kind !== "IMAGE" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider align-middle">
                {kind === "VIDEO" ? <Film className="h-2.5 w-2.5" /> : null}
                {kind}
              </span>
            )}
          </p>
          <p className="text-xs text-white/50">
            {dimensionLabel(item) ?? kind} · {index + 1} / {items.length}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            title="Copy media link"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied === "link" ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
          </button>
          <button
            onClick={handleShare}
            title="Share"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied === "share" ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
          </button>
          <a
            href={isVideo ? videoSrc : imageSrc}
            download
            onClick={(e) => {
              e.preventDefault();
              handleDownload();
            }}
            title="Download original"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
          {!isVideo && (
            <button
              onClick={() => setZoomed((z) => !z)}
              title={zoomed ? "Fit to screen" : "View full resolution"}
              className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                zoomed ? "text-white bg-white/15" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Media stage */}
      <div className="relative flex-1 min-h-0 px-2 sm:px-16 pb-4" onClick={(e) => e.stopPropagation()}>
        <div
          className={`w-full h-full flex items-center justify-center ${
            isVideo ? "" : zoomed ? "overflow-auto cursor-zoom-out" : "cursor-zoom-in"
          }`}
          onClick={() => !isVideo && setZoomed((z) => !z)}
        >
          {isVideo ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              key={videoSrc}
              src={videoSrc}
              poster={frameSrc || undefined}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.55)" }}
            />
          ) : (
            <>
              {!loaded && <Loader2 className="absolute h-8 w-8 text-white/40 animate-spin" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={mediaRef}
                src={imageSrc}
                alt={item.title ?? "Gallery image"}
                onLoad={() => setLoaded(true)}
                className={`transition-all duration-300 ${
                  zoomed
                    ? "max-w-none h-auto w-auto object-contain" // true 1:1 pixels, scrollable
                    : "max-w-full max-h-full w-auto h-auto object-contain"
                }`}
                style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.55)" }}
              />
            </>
          )}
        </div>

        {/* Prev / next */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              title="Previous"
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 backdrop-blur transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              title="Next"
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 backdrop-blur transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Caption strip */}
      {(item.description || item.linkUrl) && (
        <div
          className="shrink-0 px-4 sm:px-6 pb-4 flex items-center justify-center gap-3 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {item.description && <p className="text-xs sm:text-sm text-white/60 max-w-xl">{item.description}</p>}
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white hover:text-[#ff8a93] transition-colors shrink-0"
            >
              Details <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Gallery grid ──────────────────────────────────────────────────────── */

export function GalleryList() {
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    let cancelled = false;
    fetchGalleryItems().then(({ data, error }) => {
      if (cancelled) return;
      setItems(data ?? []);
      setError(error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Group key: explicit admin group first, then media-kind buckets.
  const groups = useMemo(() => {
    const map = new Map<string, PublicGalleryItem[]>();
    for (const p of items) {
      const key = p.groupName?.trim() || kindOf(p);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [items]);

  const visible = useMemo(
    () => (filter === "All" ? groups : groups.filter(([name]) => name === filter)),
    [groups, filter],
  );

  // Flatten in display order for lightbox navigation.
  const flat = useMemo(() => visible.flatMap(([, ps]) => ps), [visible]);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#A0111C] animate-spin" />
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <ImageOff className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">
          {error ? "The gallery is unavailable right now." : "No gallery items available yet."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Group filter chips — only when there's more than one bucket */}
      {(groups.length > 1 || filter !== "All") && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {["All", ...groups.map(([name]) => name)].map((name) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === name
                  ? "bg-[#A0111C] text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:text-[#A0111C] hover:border-[#A0111C]/40"
              }`}
            >
              {name}
              {name !== "All" && (
                <span className="ml-1.5 opacity-60">{groups.find(([n]) => n === name)?.[1].length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {visible.map(([name, ps]) => (
        <div key={name} className="mb-12 last:mb-0">
          {visible.length > 1 && (
            <div className="flex items-center gap-3 mb-6">
              <h3
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {name}
              </h3>
              <span className="text-xs text-gray-400">
                {ps.length} item{ps.length !== 1 ? "s" : ""}
              </span>
              <span className="flex-1 h-px bg-gray-100" />
            </div>
          )}

          {/* Adaptive uniform grid — columns grow with the item count
              (1–5 per row), responsive on every screen size. All tiles share
              one group aspect so every row lines up perfectly. */}
          <div className={`grid gap-3 sm:gap-4 ${gridClass(ps.length)}${ps.length === 1 ? " justify-items-center" : ""}`}>
            {ps.map((item) => {
              const flatIdx = flat.indexOf(item);
              const kind = kindOf(item);
              const isVideo = kind === "VIDEO";
              const tileSrc = isVideo && item.posterFrameUrl ? item.posterFrameUrl : item.imageUrl;
              return (
                <button
                  key={item.id}
                  onClick={() => setLightbox(flatIdx)}
                  className={`group relative block overflow-hidden rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#A0111C]/50 focus:ring-offset-2 ${
                    ps.length === 1 ? "w-full max-w-md" : "w-full"
                  }`}
                  aria-label={item.title ? `View ${item.title}` : "View gallery item"}
                >
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: groupAspect(ps) }}>
                    {isVideo && !item.posterFrameUrl ? (
                      <video
                        src={mediaUrl(item.imageUrl)}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : tileSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(tileSrc)}
                        alt={item.title ?? "Gallery item"}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    ) : (
                      <GalleryPlaceholder />
                    )}

                    {/* Hover veil */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Video play badge */}
                    {isVideo && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </span>
                      </span>
                    )}

                    {/* Collage badge */}
                    {kind === "COLLAGE" && (
                      <span className="absolute top-3 left-3 rounded-full bg-black/55 text-white text-[10px] font-semibold px-2.5 py-1 backdrop-blur-sm">
                        Collage
                      </span>
                    )}

                    {/* Zoom cue */}
                    <span className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 text-[#A0111C] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </span>

                    {/* Dimension chip — bottom-left, appears on hover only */}
                    {dimensionLabel(item) && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-black/55 text-white text-[10px] font-semibold px-2.5 py-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {dimensionLabel(item)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {lightbox !== null && flat[lightbox] && (
        <GalleryLightbox
          items={flat}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </div>
  );
}
