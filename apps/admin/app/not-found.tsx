import Link from "next/link";

/**
 * Root not-found page for the admin portal — a missing/gone record or bad URL
 * shows this instead of the framework default.
 */
export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center p-10">
      <div className="max-w-sm rounded-lg border bg-card p-8 text-center">
        <p className="text-sm font-semibold">Page not found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The page you requested does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-xs font-semibold underline hover:text-gray-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
