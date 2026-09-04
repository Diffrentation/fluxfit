"use client";

import { useEffect, useRef } from "react";
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

// How long a freshly (re)mounted page's own settle-in scroll ticks are
// ignored for recording purposes — see the `restoreTargetRef` note below.
const RESTORE_WINDOW_MS = 1000;

/**
 * Wraps the app in GSAP ScrollSmoother's required #smooth-wrapper /
 * #smooth-content structure. `<Nav />` and any other position:fixed chrome
 * must be rendered as siblings of this component, never inside it — a CSS
 * transform on an ancestor (which is how ScrollSmoother works) turns
 * `position: fixed` descendants into something anchored to that ancestor's
 * full scrollable height instead of the viewport.
 *
 * Also owns scroll positioning on navigation: a fresh (link-click)
 * navigation lands at the top, while returning to a page via the
 * back/forward button (mobile swipe-back included, since that fires the
 * same native `popstate`) restores exactly where that page was left.
 *
 * This can't just be "was the last navigation a popstate, then restore" in
 * the pathname-change effect — Next's App Router updates `usePathname()`
 * (and so re-runs that effect) *before* the native `popstate` event reaches
 * a listener registered here, not after, so that flag always reads stale.
 * Instead the popstate handler applies the correction itself, whenever it
 * actually fires, directly against whatever scroller is live at that point.
 */
export default function GsapSmoothScroll({ children }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const scrollPositions = useRef(new Map());
  const smootherRef = useRef(null);

  // Snapshot of the target restore position for whichever page is *currently*
  // mounting, frozen the instant its smoother is created. A freshly created
  // smoother fires a few of its own settle-in `onUpdate` ticks (e.g. from
  // `effects: true` parallax recalculation) before any real user scrolling
  // happens — without this freeze, those ticks immediately overwrite the
  // very map entry the popstate handler is about to read from, clobbering
  // the saved position before it's ever applied. `null` once no restore is
  // pending, at which point onUpdate resumes recording live scroll normally.
  const restoreTargetRef = useRef(null);

  // Runs on every render (not gated on [pathname]) so it's always current by
  // the time either the popstate handler or the scroll-tracking effect below
  // reads it, regardless of which one happens to run first.
  useEffect(() => {
    pathnameRef.current = pathname;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const restoreForCurrentPath = () => {
      const savedY = restoreTargetRef.current;
      if (savedY == null) return;
      if (smootherRef.current) {
        // Recalculate scrollable bounds against whatever's in the DOM right
        // now *before* setting the position — otherwise ScrollSmoother can
        // clamp against a stale (often shorter, pre-content-load) height.
        smootherRef.current.refresh();
        smootherRef.current.scrollTop(savedY);
      } else {
        window.scrollTo(0, savedY);
      }
    };

    const handlePopState = () => {
      // Client-fetched content (product grids, etc.) can still be loading
      // when popstate fires, so the page's real scrollable height isn't
      // settled yet — reapply the correction across a few delays to catch
      // it wherever that lands rather than guessing one fixed timeout.
      requestAnimationFrame(restoreForCurrentPath);
      window.setTimeout(restoreForCurrentPath, 350);
      window.setTimeout(restoreForCurrentPath, 900);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const useNativeScroll = NATIVE_SCROLL_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    // Freeze whatever was last recorded for this path (if anything) so the
    // page's own settle-in ticks below can't clobber it before a possible
    // popstate-triggered restore gets to consume it.
    restoreTargetRef.current = scrollPositions.current.get(pathname) ?? null;
    const unfreezeTimer = window.setTimeout(() => {
      restoreTargetRef.current = null;
    }, RESTORE_WINDOW_MS);

    if (useNativeScroll) {
      smootherRef.current = null;
      window.scrollTo(0, 0);
      const handleScroll = () => {
        if (restoreTargetRef.current != null) return;
        scrollPositions.current.set(pathnameRef.current, window.scrollY);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.clearTimeout(unfreezeTimer);
        window.removeEventListener("scroll", handleScroll);
      };
    }

    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      effects: true,
      normalizeScroll: true,
      // Record scroll position continuously (tagged to whichever pathname is
      // current right now) rather than reading it once at teardown — by the
      // time this effect's cleanup runs on navigation, Next has generally
      // already swapped in the new page's DOM underneath, and GSAP's height
      // recalculation against that new (usually shorter) content clamps
      // scrollTop() back toward 0 before we get a chance to read it.
      onUpdate: (self) => {
        if (restoreTargetRef.current != null) return;
        scrollPositions.current.set(pathnameRef.current, self.scrollTop());
      },
    });
    smootherRef.current = smoother;
    smoother.scrollTop(0);

    // Client-fetched content (product grids, etc.) changes page height
    // after this mounts — re-measure shortly after so scroll math stays
    // accurate instead of clamping on a stale, shorter page height. If this
    // navigation turns out to be a back/forward one, the popstate handler's
    // own follow-up corrections (above) re-apply the saved position after
    // this refresh, so the two don't fight over the final value.
    const refreshTimer = window.setTimeout(() => {
      smoother.refresh();
    }, 300);

    return () => {
      window.clearTimeout(unfreezeTimer);
      window.clearTimeout(refreshTimer);
      smoother.kill();
      if (smootherRef.current === smoother) smootherRef.current = null;
    };
  }, [pathname]);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
}
