import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const { accessToken } = await res.json().catch(() => ({}));
  if (!accessToken) return null;

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return accessToken as string;
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const apiPath = "/" + path.join("/");
  const url = `${API_BASE}${apiPath}`;

  const cookieStore = await cookies();
  let token = cookieStore.get("access_token")?.value ?? null;

  // Pre-emptively refresh if no token is present
  if (!token) {
    token = await tryRefresh();
  }

  const contentType = req.headers.get("content-type");
  const isMultipart = contentType?.includes("multipart/form-data") ?? false;

  let body: BodyInit | null = null;
  let setContentType = false;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (isMultipart) {
      body = await req.formData();
    } else {
      const text = await req.text();
      if (text) {
        body = text;
        setContentType = true;
      }
    }
  }

  const buildHeaders = (t: string | null) => {
    const h = new Headers();
    if (t) h.set("Authorization", `Bearer ${t}`);
    if (setContentType) h.set("content-type", "application/json");
    return h;
  };

  const doFetch = (t: string | null) =>
    fetch(url, {
      method: req.method,
      headers: buildHeaders(t),
      body: body ?? undefined,
      // @ts-expect-error -- Node 18+ supports this
      duplex: "half",
    });

  let upstream: Response;
  try {
    upstream = await doFetch(token);
  } catch {
    return NextResponse.json({ message: "Cannot reach API server" }, { status: 502 });
  }

  // On 401: refresh token and retry once
  if (upstream.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      try {
        upstream = await doFetch(newToken);
      } catch {
        return NextResponse.json({ message: "Cannot reach API server" }, { status: 502 });
      }
    }
  }

  const responseBody = await upstream.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
