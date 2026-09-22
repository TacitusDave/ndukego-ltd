"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PROXY_BASE = "/api/proxy";

function isUserLoggedIn(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith("web_user_info="));
}

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  iconOnly?: boolean;
  /** "overlay" = bare heart drawn directly on a photo (white outline, drop shadow). */
  variant?: "default" | "overlay";
}

export function FavoriteButton({
  propertyId,
  className,
  iconOnly = false,
  variant = "default",
}: FavoriteButtonProps) {
  const overlay = variant === "overlay";
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = isUserLoggedIn();
    if (!loggedIn) {
      setIsLoading(false);
      return;
    }
    setIsLoggedIn(true);

    fetch(`${PROXY_BASE}/properties/${propertyId}/favorite-status`)
      .then((r) => r.json())
      .then((d) => setIsFavorited(d.isFavorited ?? false))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [propertyId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      window.location.href = `/login?from=/properties/${propertyId}`;
      return;
    }

    setIsFavorited((prev) => !prev);
    try {
      const res = await fetch(`${PROXY_BASE}/properties/${propertyId}/favorite`, {
        method: "POST",
      });
      const data = await res.json();
      setIsFavorited(data.isFavorited);
    } catch {
      setIsFavorited((prev) => !prev);
    }
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 ${
          overlay ? "text-white/90" : "text-muted-foreground"
        } ${className ?? ""}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {!iconOnly && <span className="text-sm">Loading…</span>}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      title={isFavorited ? "Remove from saved" : isLoggedIn ? "Save property" : "Sign in to save"}
      className={`flex items-center gap-2 transition-colors group ${
        overlay
          ? isFavorited
            ? "text-red-500"
            : "text-white hover:text-red-200"
          : isFavorited
            ? "text-red-500 hover:text-red-600"
            : "text-muted-foreground hover:text-red-500"
      } ${className ?? ""}`}
    >
      <Heart
        className={cn(
          "transition-all",
          overlay ? "h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "h-5 w-5",
          isFavorited ? "fill-current" : overlay ? "group-hover:fill-white/30" : "group-hover:fill-red-100",
        )}
      />
      {!iconOnly && (
        <span className="text-sm font-medium">
          {isFavorited ? "Saved" : "Save property"}
        </span>
      )}
    </button>
  );
}
