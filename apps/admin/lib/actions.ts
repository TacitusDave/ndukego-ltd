"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { refreshSession } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

async function getValidToken(): Promise<string | null> {
  const token = await getAuthToken();
  if (token) return token;
  const refreshed = await refreshSession();
  if (!refreshed) return null;
  return getAuthToken();
}

async function authPost(path: string, body: Record<string, unknown>) {
  let token = await getValidToken();
  if (!token) return { error: "Not authenticated" };

  const doFetch = (t: string) =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(body),
      cache: "no-store",
    });

  let res: Response;
  try {
    res = await doFetch(token);
  } catch {
    return { error: "Cannot reach API server. Is it running?" };
  }

  if (res.status === 401) {
    const ok = await refreshSession();
    if (ok) {
      token = (await getAuthToken()) ?? token;
      try { res = await doFetch(token); } catch { return { error: "Cannot reach API server. Is it running?" }; }
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = Array.isArray(json.message)
      ? json.message.join(", ")
      : (json.message ?? `HTTP ${res.status}`);
    if (Array.isArray(json.requirements) && json.requirements.length > 0) {
      message += ": " + json.requirements.join("; ");
    }
    return { error: message };
  }
  return { data: json, error: null };
}

async function authDelete(path: string) {
  let token = await getValidToken();
  if (!token) return { error: "Not authenticated" };

  const doFetch = (t: string) =>
    fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
      cache: "no-store",
    });

  let res: Response;
  try {
    res = await doFetch(token);
  } catch {
    return { error: "Cannot reach API server. Is it running?" };
  }

  if (res.status === 401) {
    const ok = await refreshSession();
    if (ok) {
      token = (await getAuthToken()) ?? token;
      try { res = await doFetch(token); } catch { return { error: "Cannot reach API server. Is it running?" }; }
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(json.message)
      ? json.message.join(", ")
      : (json.message ?? `HTTP ${res.status}`);
    return { error: message };
  }
  return { data: json, error: null };
}

async function authPatch(path: string, body: Record<string, unknown>) {
  let token = await getValidToken();
  if (!token) return { error: "Not authenticated" };

  const doFetch = (t: string) =>
    fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(body),
      cache: "no-store",
    });

  let res: Response;
  try {
    res = await doFetch(token);
  } catch {
    return { error: "Cannot reach API server. Is it running?" };
  }

  if (res.status === 401) {
    const ok = await refreshSession();
    if (ok) {
      token = (await getAuthToken()) ?? token;
      try { res = await doFetch(token); } catch { return { error: "Cannot reach API server. Is it running?" }; }
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(json.message)
      ? json.message.join(", ")
      : (json.message ?? `HTTP ${res.status}`);
    return { error: message };
  }
  return { data: json, error: null };
}

function num(val: FormDataEntryValue | null) {
  if (!val || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function str(val: FormDataEntryValue | null) {
  if (!val || val === "") return undefined;
  return String(val);
}

export async function createEstate(prevState: { error: string | null }, formData: FormData) {
  const body: Record<string, unknown> = {
    companyId: str(formData.get("companyId")),
    name: str(formData.get("name")),
    code: str(formData.get("code")),
    state: str(formData.get("state")),
    description: str(formData.get("description")),
    shortDescription: str(formData.get("shortDescription")),
    lga: str(formData.get("lga")),
    city: str(formData.get("city")),
    district: str(formData.get("district")),
    community: str(formData.get("community")),
    address: str(formData.get("address")),
    totalLandSize: num(formData.get("totalLandSize")),
    totalPlots: num(formData.get("totalPlots")),
  };

  const { data, error } = await authPost("/estates", body);
  if (error) return { error };

  redirect(`/estates/${(data as { id: string }).id}`);
}

export async function createProperty(prevState: { error: string | null }, formData: FormData) {
  const body: Record<string, unknown> = {
    estateId: str(formData.get("estateId")),
    title: str(formData.get("title")),
    category: str(formData.get("category")),
    type: str(formData.get("type")),
    state: str(formData.get("state")),
    lga: str(formData.get("lga")),
    city: str(formData.get("city")),
    description: str(formData.get("description")),
    shortDescription: str(formData.get("shortDescription")),
    listingPrice: num(formData.get("listingPrice")),
    landSize: num(formData.get("landSize")),
    bedrooms: num(formData.get("bedrooms")),
    bathrooms: num(formData.get("bathrooms")),
    installmentAllowed: formData.get("installmentAllowed") === "on",
    reservationAmount: num(formData.get("reservationAmount")),
  };

  const { data, error } = await authPost("/properties", body);
  if (error) return { error };

  redirect(`/properties/${(data as { id: string }).id}`);
}

export async function transitionPropertyStatus(
  id: string,
  status: string,
  reason?: string,
) {
  const { error } = await authPost(`/properties/${id}/status`, { status, reason });
  if (error) return { error };
  return { error: null };
}

export async function togglePropertyFeatured(id: string, featured: boolean) {
  const { error } = await authPatch(`/properties/${id}`, { featured });
  if (error) return { error };
  return { error: null };
}

export async function toggleEstateFeatured(id: string, featured: boolean) {
  const { error } = await authPatch(`/estates/${id}`, { featured });
  if (error) return { error };
  return { error: null };
}

export async function updateProperty(
  id: string,
  prevState: { error: string | null; success?: boolean },
  formData: FormData,
) {
  const amenitiesJson = formData.get("amenitiesJson") as string | null;
  const body: Record<string, unknown> = {
    title: str(formData.get("title")),
    state: str(formData.get("state")),
    lga: str(formData.get("lga")),
    city: str(formData.get("city")),
    description: str(formData.get("description")),
    shortDescription: str(formData.get("shortDescription")),
    listingPrice: num(formData.get("listingPrice")),
    landSize: num(formData.get("landSize")),
    bedrooms: num(formData.get("bedrooms")),
    bathrooms: num(formData.get("bathrooms")),
    installmentAllowed: formData.get("installmentAllowed") === "on",
    reservationAmount: num(formData.get("reservationAmount")),
    mapUrl: str(formData.get("mapUrl")),
    amenities: amenitiesJson ? JSON.parse(amenitiesJson) : undefined,
    latitude: str(formData.get("latitude")),
    longitude: str(formData.get("longitude")),
  };

  const { error } = await authPatch(`/properties/${id}`, body);
  if (error) return { error, success: false };
  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  return { error: null, success: true };
}

export async function updateEstateDetails(id: string, fields: {
  amenities?: string[];
  mapUrl?: string;
  latitude?: string;
  longitude?: string;
}) {
  const { error } = await authPatch(`/estates/${id}`, fields);
  if (error) return { error };
  revalidatePath(`/estates/${id}`);
  revalidatePath("/estates");
  return { error: null };
}

export async function updateEstateBuildingTypes(id: string, buildingTypes: unknown[]) {
  const { error } = await authPatch(`/estates/${id}/building-types`, { buildingTypes });
  if (error) return { error };
  revalidatePath(`/estates/${id}`);
  revalidatePath("/estates");
  return { error: null };
}

export async function hardDeleteProperty(id: string) {
  const { error } = await authDelete(`/properties/${id}/permanent`);
  if (error) return { error };
  return { error: null };
}

export async function hardDeleteEstate(id: string) {
  const { error } = await authDelete(`/estates/${id}/permanent`);
  if (error) return { error };
  return { error: null };
}

export async function createCustomer(prevState: { error: string | null }, formData: FormData) {
  const body: Record<string, unknown> = {
    type: str(formData.get("type")) ?? "INDIVIDUAL",
    firstName: str(formData.get("firstName")),
    lastName: str(formData.get("lastName")),
    middleName: str(formData.get("middleName")),
    companyName: str(formData.get("companyName")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    whatsapp: str(formData.get("whatsapp")),
    alternatePhone: str(formData.get("alternatePhone")),
    address: str(formData.get("address")),
    city: str(formData.get("city")),
    state: str(formData.get("state")),
    occupation: str(formData.get("occupation")),
    leadSource: str(formData.get("leadSource")),
    notes: str(formData.get("notes")),
  };

  const { data, error } = await authPost("/customers", body);
  if (error) return { error };

  redirect(`/customers/${(data as { id: string }).id}`);
}

export async function updateDocumentStatus(id: string, status: string) {
  const { error } = await authPatch(`/documents/${id}/status`, { status });
  if (error) return { error };
  return { error: null };
}

export async function deleteDocument(id: string) {
  const { error } = await authDelete(`/documents/${id}`);
  if (error) return { error };
  return { error: null };
}
