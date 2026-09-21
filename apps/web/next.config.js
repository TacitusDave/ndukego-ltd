/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_IMAGE_URL ?? process.env.NEXT_PUBLIC_API_BASE;

function apiOriginPattern() {
  if (!API_ORIGIN) return undefined;
  try {
    const url = new URL(API_ORIGIN);
    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/uploads/**",
    };
  } catch {
    return undefined;
  }
}

const nextConfig = {
  transpilePackages: ["@nhgp/assets"],
  allowedDevOrigins: ["192.168.0.192"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      ...(apiOriginPattern() ? [apiOriginPattern()] : []),
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000",
  },
};

export default nextConfig;
