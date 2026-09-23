import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nhgp/assets"],
  reactCompiler: true,
  allowedDevOrigins: ["192.168.0.192"],
  // Build identity, inlined at build time and shown in the admin shell. If the
  // version in the sidebar ever stops matching the latest commit on main, the
  // deployment pipeline is broken (e.g. Vercel lost its GitHub webhook) —
  // this is how stale deployments get noticed in seconds instead of weeks.
  env: {
    NEXT_PUBLIC_BUILD_VERSION:
      process.env.NEXT_PUBLIC_BUILD_VERSION ??
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ??
      "dev",
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
