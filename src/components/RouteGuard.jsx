"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spin } from "antd";
import { IconLogout } from "@tabler/icons-react";

export default function RouteGuard({ children }) {
  const { user, hydrated, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isUserViewMode, setIsUserViewMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsUserViewMode(localStorage.getItem("admin_user_view_mode") === "true");
    }
  }, [pathname, hydrated]); // re-check on navigation

  useEffect(() => {
    if (!hydrated) return;

    const isAdminRoute = pathname.startsWith("/admin");
    const isAuthRoute = pathname.startsWith("/auth");

    if (isAuthenticated) {
      const isUserViewModeSync = typeof window !== "undefined" && localStorage.getItem("admin_user_view_mode") === "true";
      if (user?.role === "admin") {
        // Admin user logic
        if (!isAdminRoute && !isAuthRoute && pathname !== "/api/auth/logout" && !isUserViewModeSync) {
          // Admin shouldn't access user routes unless in User View Mode
          router.replace("/admin");
        }
      } else {
        // Normal user logic
        if (isAdminRoute) {
          // Normal user shouldn't access admin routes
          router.replace("/?admin_denied=1");
        }
      }
    } else {
      // Unauthenticated logic
      if (isAdminRoute) {
        // Guest shouldn't access admin routes
        router.replace("/auth/login?redirect=/admin");
      }
    }
  }, [hydrated, isAuthenticated, user, pathname, router]);

  // Optionally show a loading state while hydration completes, or just render children
  // and let the useEffect redirect them. To prevent flashing of unauthorized content:
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spin size="large" />
      </div>
    );
  }

  const isUserViewModeSync = typeof window !== "undefined" && localStorage.getItem("admin_user_view_mode") === "true";

  // Prevent flashing of user content for admins
  if (user?.role === "admin" && !pathname.startsWith("/admin") && !pathname.startsWith("/auth") && !isUserViewModeSync) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spin size="large" />
      </div>
    );
  }

  // Prevent flashing of admin content for users
  if (user?.role !== "admin" && pathname.startsWith("/admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {children}
      {user?.role === "admin" && isUserViewModeSync && !pathname.startsWith("/admin") && (
        <button
          onClick={() => {
            localStorage.removeItem("admin_user_view_mode");
            setIsUserViewMode(false);
            router.push("/admin");
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
        >
          <IconLogout className="w-5 h-5" />
          <span>Exit User View</span>
        </button>
      )}
    </>
  );
}
