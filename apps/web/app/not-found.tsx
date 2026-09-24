import Link from "next/link";

/**
 * Root not-found page for the public site — catches every unmatched URL with
 * a branded screen instead of the framework default.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-24">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white/80 p-10 text-center shadow-sm">
        <p className="text-9xl font-bold uppercase tracking-widest text-[#A0111C] mb-3">
          404
        </p>
        <p
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Page not found
        </p>
        <p className="mt-2 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded bg-[#A0111C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
