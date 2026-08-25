"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./IntroVideoLoader.module.css";

const EXIT_DURATION_MS = 360;
const FAILSAFE_TIMEOUT_MS = 8000;

/**
 * A root-level, one-per-document-load intro. Because this component lives in
 * the App Router root layout it survives client-side route transitions, while
 * a refresh/direct visit creates a fresh instance and plays it again.
 */
export default function IntroVideoLoader() {
  const router = useRouter();
  const videoRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const finishTimerRef = useRef(null);
  const finishedRef = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const releasePage = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    window.clearTimeout(fallbackTimerRef.current);
    setIsLeaving(true);
    finishTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      document.documentElement.classList.remove("intro-video-active");
      document.body.classList.remove("intro-video-active");
    }, EXIT_DURATION_MS);
  }, []);

  const startVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || finishedRef.current) return;

    // A slight speed increase keeps the welcome moment brief without making
    // the clip look rushed. Muted + playsInline meets mobile autoplay rules.
    video.playbackRate = 1.6;
    const playAttempt = video.play();
    if (playAttempt?.catch) {
      playAttempt.catch(() => releasePage());
    }
  }, [releasePage]);

  useEffect(() => {
    document.documentElement.classList.add("intro-video-active");
    document.body.classList.add("intro-video-active");

    // Never leave visitors blocked if the asset is unavailable, the browser
    // rejects autoplay, or the network stalls before the video can start.
    fallbackTimerRef.current = window.setTimeout(releasePage, FAILSAFE_TIMEOUT_MS);

    // Warm the home route while the video owns the screen. Client-side data
    // widgets mounted beneath this overlay fetch in parallel as well.
    router.prefetch("/");

    return () => {
      window.clearTimeout(fallbackTimerRef.current);
      window.clearTimeout(finishTimerRef.current);
      document.documentElement.classList.remove("intro-video-active");
      document.body.classList.remove("intro-video-active");
    };
  }, [releasePage, router]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.loader}${isLeaving ? ` ${styles.leaving}` : ""}`}
      aria-hidden="true"
      role="presentation"
    >
      <video
        ref={videoRef}
        className={styles.video}
        src="/videos/fluxfit-intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onCanPlay={startVideo}
        onLoadedMetadata={startVideo}
        onEnded={releasePage}
        onError={releasePage}
      />
    </div>
  );
}
