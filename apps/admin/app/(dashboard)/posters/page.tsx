import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { apiFetch } from "@/lib/api";
import { PosterManager, type Poster } from "./poster-manager";

export const metadata: Metadata = { title: "Posters — Admin" };

export default async function PostersPage() {
  // Poster API returns a plain array
  const { data, error } = await apiFetch<Poster[] | { items: Poster[] }>("/posters");
  const posters = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div className="flex flex-col h-full">
      <Header title="Posters" />
      <div className="flex-1 p-6 space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load posters: {error}
          </div>
        )}
        {!error && <PosterManager initialPosters={posters} />}
      </div>
    </div>
  );
}
