"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side guard for routes outside /admin (middleware only covers /admin).
 * Redirects to login if there is no access token after hydration.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(pathname || "/")}`
      );
    }
  }, [hydrated, isAuthenticated, router, pathname]);

  if (!hydrated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spin size="large" />
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
