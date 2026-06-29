"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress
NProgress.configure({
  minimum: 0.08,
  easing: "ease",
  speed: 200,
  showSpinner: false,
  trickleSpeed: 200,
});

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    if (prevPathRef.current !== null && prevPathRef.current !== currentPath) {
      // Route changed — cancel any pending start timer and finish the bar
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      NProgress.done();
    }
    prevPathRef.current = currentPath;
  }, [pathname, searchParams]);

  // Intercept link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Only trigger for internal navigation (not external links, downloads, etc.)
      if (
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !target.hasAttribute("download") &&
        target.target !== "_blank"
      ) {
        // Start progress bar with slight delay to avoid flicker on instant navigations
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          NProgress.start();
        }, 100);
      }
    };

    // Also intercept browser back/forward
    const handlePopState = () => {
      NProgress.start();
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <style>{`
      #nprogress {
        pointer-events: none;
      }

      #nprogress .bar {
        background: #99BD4A;
        position: fixed;
        z-index: 99999;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        border-radius: 0 2px 2px 0;
      }

      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px #99BD4A, 0 0 5px #99BD4A;
        opacity: 1;
        transform: rotate(3deg) translate(0px, -4px);
      }
    `}</style>
  );
}
