// Client-safe media URL helpers (no server-only imports here — client
// components import from this module, not from "@/lib/api").

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// Uploads are served from the API origin. Derive it from NEXT_PUBLIC_API_URL so
// production deployments never fall back to localhost.
export const API_IMAGE_BASE =
  process.env.NEXT_PUBLIC_API_IMAGE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  API_BASE.replace(/\/api\/v1\/?$/, "");

export const API_IMAGE_PATH = "/uploads";

/** Build a browser-safe URL for an uploaded media path. */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const clean = url.replace(/^\/uploads\//, "");
  return `${API_IMAGE_BASE}${API_IMAGE_PATH}/${clean}`;
}
