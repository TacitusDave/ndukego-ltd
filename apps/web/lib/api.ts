const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// Uploads are served from the API origin. Derive it from NEXT_PUBLIC_API_URL so
// production deployments never fall back to localhost (the cause of broken images).
export const API_IMAGE_BASE =
  process.env.NEXT_PUBLIC_API_IMAGE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  API_BASE.replace(/\/api\/v1\/?$/, "");

export const API_IMAGE_PATH = "/uploads";

/**
 * Build a browser-safe URL for an uploaded media path.
 * Accepts "/uploads/..." or already-absolute URLs.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const clean = url.replace(/^\/uploads\//, "");
  return `${API_IMAGE_BASE}${API_IMAGE_PATH}/${clean}`;
}

export async function publicFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: "no-store",
    });
  } catch {
    return { data: null, error: "Cannot reach server" };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? `HTTP ${res.status}`);
    return { data: null, error: message };
  }

  const data: T = await res.json();
  return { data, error: null };
}

export interface PublicPoster {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export async function fetchPosters(): Promise<{ data: PublicPoster[] | null; error: string | null }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/posters/public`, {
      cache: "no-store",
    });
  } catch {
    return { data: null, error: "Cannot reach server" };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? `HTTP ${res.status}`);
    return { data: null, error: message };
  }

  const data: PublicPoster[] = await res.json();
  return { data, error: null };
}
