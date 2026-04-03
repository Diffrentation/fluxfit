"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/context/AuthContext";

function GuestRouteInner({ children, fallbackRedirect = "/" }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) return;
    const fromQuery = searchParams.get("redirect");
    const dest =
      fromQuery && fromQuery.startsWith("/") ? fromQuery : fallbackRedirect;
    router.replace(dest);
  }, [isInitializing, isAuthenticated, router, searchParams, fallbackRedirect]);

  if (isInitializing) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spin size="large" tip="Loading…" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return children;
}

/**
 * Redirects authenticated users away (e.g. login/register).
 * Wrap inner content that uses useSearchParams in Suspense at the page level when needed.
 */
export default function GuestRoute({ children, fallbackRedirect = "/" }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <GuestRouteInner fallbackRedirect={fallbackRedirect}>
        {children}
      </GuestRouteInner>
    </Suspense>
  );
}
