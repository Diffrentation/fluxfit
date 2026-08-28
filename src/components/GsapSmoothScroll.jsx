"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

// Dashboards are data-dense (AG Grid tables, a permanently fixed sidebar)
// and don't benefit from cinematic smoothing, so they stay on native scroll.
const NATIVE_SCROLL_PREFIXES = ["/admin"];

/**
 * Wraps the app in GSAP ScrollSmoother's required #smooth-wrapper /
 * #smooth-content structure. `<Nav />` and any other position:fixed chrome
 * must be rendered as siblings of this component, never inside it — a CSS
 * transform on an ancestor (which is how ScrollSmoother works) turns
 * `position: fixed` descendants into something anchored to that ancestor's
 * full scrollable height instead of the viewport.
 *
 * Also owns "scroll to top on every navigation": the browser's native
 * back/forward scroll restoration fights with both client-fetched page
 * heights and with ScrollSmoother's virtualized scroll position, so this
 * takes it over entirely rather than let two systems fight over it.
 */
export default function GsapSmoothScroll({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const useNativeScroll = NATIVE_SCROLL_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (useNativeScroll) {
      window.scrollTo(0, 0);
      return;
    }

    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      effects: true,
      normalizeScroll: true,
    });
    smoother.scrollTo(0, false);

    // Client-fetched content (product grids, etc.) changes page height
    // after this mounts — re-measure shortly after so scroll math stays
    // accurate instead of clamping on a stale, shorter page height.
    const refreshTimer = window.setTimeout(() => smoother.refresh(), 300);

    return () => {
      window.clearTimeout(refreshTimer);
      smoother.kill();
    };
  }, [pathname]);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
}
