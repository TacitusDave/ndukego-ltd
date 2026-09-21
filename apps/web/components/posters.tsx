"use client";

import { useEffect, useState } from "react";
import { ImageOff, ExternalLink, Loader2 } from "lucide-react";
import { fetchPosters, mediaUrl, type PublicPoster } from "@/lib/api";

function PosterPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <ImageOff className="h-10 w-10 text-gray-400" />
    </div>
  );
}

export function PosterList() {
  const [posters, setPosters] = useState<PublicPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPosters().then(({ data, error }) => {
      if (cancelled) return;
      setPosters(data ?? []);
      setError(error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#A0111C] animate-spin" />
      </div>
    );
  }

  if (error || posters.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <ImageOff className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">
          {error ? "Posters are unavailable right now." : "No posters available yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posters.map((poster) => (
        <div
          key={poster.id}
          className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:border-[#A0111C]/20 transition-all duration-300"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
            {poster.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(poster.imageUrl)}
                alt={poster.title ?? "Property poster"}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
            ) : (
              <PosterPlaceholder />
            )}
          </div>
          {(poster.title || poster.description || poster.linkUrl) && (
            <div className="p-5">
              {poster.title && (
                <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {poster.title}
                </h3>
              )}
              {poster.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{poster.description}</p>
              )}
              {poster.linkUrl && (
                <a
                  href={poster.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#A0111C] hover:text-[#B41523] transition-colors"
                >
                  View details <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
