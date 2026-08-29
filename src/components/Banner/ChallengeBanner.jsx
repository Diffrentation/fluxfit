"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { IconX } from "@tabler/icons-react";

export default function ChallengeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if not dismissed previously
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("5k_banner_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem("5k_banner_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[#1e9a58] text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold relative z-50 flex items-center justify-center gap-2">
      <Link href="/5k-challenge" className="hover:underline flex items-center gap-1">
        <span>🔥 5K CHALLENGE IS LIVE — GET 100% CASHBACK</span>
      </Link>
      <button onClick={dismiss} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors">
        <IconX className="w-4 h-4" />
      </button>
    </div>
  );
}
