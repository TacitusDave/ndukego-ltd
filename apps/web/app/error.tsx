"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Route-level error boundary for the public site. Any unhandled crash shows
 * this calm, on-brand recovery screen instead of Next's raw error dump.
 */
export default function WebError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[web] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-24">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white/80 p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#A0111C]/10">
          <AlertTriangle className="h-6 w-6 text-[#A0111C]" />
        </div>
        <p
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Something went wrong
        </p>
        <p className="mt-2 text-sm text-gray-500">
          This page hit an unexpected error. It&apos;s usually temporary — try
          again, or head back to the homepage.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded bg-[#A0111C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="rounded border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
