"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Route-level error boundary. Any unhandled render/async crash inside the
 * dashboard shows this recoverable screen instead of Next's raw error dump —
 * staff can retry immediately without signing out and back in.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in Vercel/Railway logs for diagnosis, but the UI stays calm.
    console.error("[admin] dashboard render error:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50/60 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <p className="text-sm font-semibold text-gray-900">
          Something went wrong loading this page
        </p>
        <p className="mt-1 text-xs text-gray-500">
          This is usually temporary. Try again — your session was not affected.
          {error.digest ? ` (ref: ${error.digest})` : ""}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
          <Link
            href="/"
            className="text-xs font-semibold text-gray-500 underline hover:text-gray-800"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
