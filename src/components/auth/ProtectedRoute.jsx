"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side guard for routes that require authentication.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      // Preserve the full URL (including query string, e.g. Buy Now's
      // ?mode=buy-now&productId=...) so the user lands back on the exact
      // page they were trying to reach after logging in. Read the query
      // string from window.location (client-only, inside this effect)
      // rather than useSearchParams() — that hook requires every render
      // path of ProtectedRoute's ~7 call sites to be wrapped in <Suspense>,
      // which they aren't today.
      const qs =
        typeof window !== "undefined" ? window.location.search : "";
      const fullPath = `${pathname || "/"}${qs || ""}`;
      router.replace(`/auth/login?redirect=${encodeURIComponent(fullPath)}`);
    }
  }, [isInitializing, isAuthenticated, router, pathname]);

  if (isInitializing) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spin size="large" tip="Loading session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return children;
}
