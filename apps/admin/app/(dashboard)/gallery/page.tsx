import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { apiFetch } from "@/lib/api";
import { GalleryManager, type GalleryItem } from "./gallery-manager";

export const metadata: Metadata = { title: "Gallery — Admin" };

export default async function GalleryPage() {
  // Gallery API returns a plain array
  const { data, error } = await apiFetch<GalleryItem[] | { items: GalleryItem[] }>("/gallery");
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div className="flex flex-col h-full">
      <Header title="Gallery" />
      <div className="flex-1 p-6 space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load gallery: {error}
          </div>
        )}
        {!error && <GalleryManager initialItems={items} />}
      </div>
    </div>
  );
}
