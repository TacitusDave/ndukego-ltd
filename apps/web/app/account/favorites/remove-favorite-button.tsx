"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function RemoveFavoriteButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    try {
      await fetch(`/api/proxy/properties/${propertyId}/favorite`, { method: "POST" });
      router.refresh();
    } catch {
      // leave the item visible on failure
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-3 w-3 animate-spin" />}
      Remove
    </button>
  );
}
