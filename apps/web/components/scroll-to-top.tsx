"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "nhgp_cookie_consent";
const COOKIE_BANNER_EVENT = "nhgp:cookie-banner";

/**
 * Resets the scroll position to the very top whenever the route changes,
 * so navigating between pages never leaves the user mid-page.
 */
export function RouteScrollReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Floating "back to top" button — appears after the user scrolls down and
 * smoothly takes them to the very top on click/tap. Shifts upward while the
 * cookie consent banner is on screen so the two never overlap.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Coordinate with the cookie consent banner (shared localStorage key + event).
    try {
      setBannerVisible(!localStorage.getItem(COOKIE_CONSENT_KEY));
    } catch {
      // localStorage blocked (private mode etc.) — assume not shown
    }
    const onBannerEvent = (e: Event) => {
      setBannerVisible((e as CustomEvent<string>).detail === "shown");
    };
    window.addEventListener(COOKIE_BANNER_EVENT, onBannerEvent);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(COOKIE_BANNER_EVENT, onBannerEvent);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-to-top"
          type="button"
          aria-label="Back to top"
          title="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#A0111C] text-white shadow-lg shadow-[#A0111C]/30 transition-[bottom,background-color] duration-300 hover:bg-[#B41523] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A0111C]/40 sm:right-6",
            bannerVisible ? "bottom-48 sm:bottom-36" : "bottom-6",
          )}
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
