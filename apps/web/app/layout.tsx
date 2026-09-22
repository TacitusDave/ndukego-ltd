import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ConditionalFooter } from "@/components/conditional-footer";
import { RouteScrollReset, ScrollToTopButton } from "@/components/scroll-to-top";
import { CookieBanner } from "@/components/cookie-banner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Ndukego Investment & Properties — Real Estate, Financing & Investment in Nigeria",
    template: "%s | Ndukego Investment & Properties",
  },
  description:
    "Nigeria's premier property and investment group. Real estate listings, LPO financing, investment financing, and expert consultancy across Nigeria.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="light">
      <body className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col`}>
        {/* ── Global paper dot texture ── */}
        <div aria-hidden className="nhgp-paper-bg" />

        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <ConditionalFooter>
          <Footer />
        </ConditionalFooter>
        <Suspense fallback={null}>
          <RouteScrollReset />
        </Suspense>
        <ScrollToTopButton />
        <CookieBanner />
        <SpeedInsights />
      </body>
    </html>
  );
}
