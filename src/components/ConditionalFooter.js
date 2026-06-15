"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const { user, hydrated } = useAuth();
  const [isUserViewMode, setIsUserViewMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsUserViewMode(localStorage.getItem("admin_user_view_mode") === "true");
    }
  }, [pathname]);
  
  const isAdminPage = pathname?.startsWith("/admin");
  const isAdminUser = hydrated && user?.role === "admin" && !isUserViewMode;

  if (isAdminPage || isAdminUser) {
    return null;
  }

  return <Footer />;
}
