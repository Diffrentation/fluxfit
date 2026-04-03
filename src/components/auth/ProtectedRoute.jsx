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
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(pathname || "/")}`
      );
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
