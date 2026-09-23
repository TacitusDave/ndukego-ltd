import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// Re-exported for server components that already import from "@/lib/api".
// Client components must import from "@/lib/media" instead (this module uses
// next/headers, which is server-only).
export { API_IMAGE_BASE, API_IMAGE_PATH, mediaUrl } from "./media";

/**
 * Request a fresh access token using the refresh-token cookie.
 * Returns the new token, or null if the session cannot be recovered.
 */
async function tryRefresh(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) return null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const { accessToken } = await res.json().catch(() => ({}));
  if (!accessToken) return null;

  // Persist the fresh access token so subsequent requests in this render
  // (and the next page view) start with a valid token. Cookie writes throw
  // outside a request scope (prerender) — never let that crash the render.
  try {
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
  } catch {
    // Token still returned; only persistence is skipped.
  }
  return accessToken as string;
}

/**
 * Server-side authenticated fetch for RSC page loads.
 * Transparently refreshes an expired access token once and retries, so a
 * 15-minute idle never surfaces "Invalid or expired token" to the user.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  const cookieStore = await cookies();
  let token = cookieStore.get("access_token")?.value;

  // No token at all (or only a stale one) → try to recover before first request.
  if (!token) {
    token = (await tryRefresh()) ?? undefined;
  }

  const doFetch = (t: string | undefined) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    });

  let res: Response;
  try {
    res = await doFetch(token);
  } catch {
    return { data: null, error: "Cannot reach API server. Is it running?" };
  }

  // Access token expired mid-session → refresh once and retry.
  if (res.status === 401) {
    const fresh = await tryRefresh();
    if (fresh) {
      try {
        res = await doFetch(fresh);
      } catch {
        return { data: null, error: "Cannot reach API server. Is it running?" };
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? `HTTP ${res.status}`);
    return { data: null, error: message };
  }

  const data: T = await res.json();
  return { data, error: null };
}

export async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<{ data: T; error: null } | { data: null; error: string }> {
  return apiFetch<T>(path, { method: "DELETE" });
}
