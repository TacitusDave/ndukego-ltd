"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function login(email: string, password: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { error: "Cannot connect to server. Make sure the API is running (pnpm run dev from the project root)." };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Login failed");
    return { error: message };
  }

  const { accessToken, refreshToken, user } = await res.json();

  const cookieStore = await cookies();
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  cookieStore.set(
    "user_info",
    JSON.stringify({ id: user.id, email: user.email, type: user.type, permissions: user.permissions ?? [] }),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    },
  );

  return { error: null };
}

export async function superLogin(email: string, code: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/super/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
  } catch {
    return { error: "Cannot connect to server." };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Authentication failed");
    return { error: message };
  }

  const { accessToken, refreshToken, user } = await res.json();
  const cookieStore = await cookies();
  cookieStore.set("access_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 15 * 60, path: "/" });
  cookieStore.set("refresh_token", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/" });
  cookieStore.set("user_info", JSON.stringify({ id: user.id, email: user.email, type: user.type, permissions: user.permissions ?? [] }), { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/" });
  return { error: null };
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_info");
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const userInfoStr = cookieStore.get("user_info")?.value;
  if (!token || !userInfoStr) return null;
  try {
    return { token, user: JSON.parse(userInfoStr) as { id: string; email: string; type: string; permissions?: string[] } };
  } catch {
    return null;
  }
}

export async function refreshSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) return false;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return false;
  }

  if (!res.ok) return false;

  const { accessToken } = await res.json();
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });
  return true;
}
