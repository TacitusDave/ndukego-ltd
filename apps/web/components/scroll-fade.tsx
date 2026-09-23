"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom scrollbar that fades away when the user isn't scrolling and returns
 * on any scroll/wheel/touch activity. A 3px right-edge track that only
 * appears when relevant — the detail that keeps long pages feeling precise.
 *
 * Rendered as a fixed overlay; the native scrollbar stays hidden site-wide
 * while this component is mounted.
 */
export function ScrollFade() {
  const [visible, setVisible] = useState(false);
  const [thumb, setThumb] = useState({ top: 0, height: 100 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setThumb({ top: 0, height: 100 });
        return;
      }
      const frac = window.scrollY / scrollable;
      const h = Math.max((window.innerHeight / doc.scrollHeight) * 100, 8);
      setThumb({ top: frac * (100 - h), height: h });
    };

    const show = () => {
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 1200);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      show();
    };

    update();
    show();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed right-0 top-0 z-[80] h-full w-[5px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 400ms ease" }}
    >
      <div className="absolute inset-y-0 right-[1px] w-[3px] rounded-full bg-[#A0111C]/[0.07]" />
      <div
        className="absolute right-[1px] w-[3px] rounded-full bg-[#A0111C]/45"
        style={{ top: `${thumb.top}%`, height: `${thumb.height}%` }}
      />
    </div>
  );
}
