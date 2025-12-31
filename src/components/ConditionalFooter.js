"use client";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) {
    return null;
  }

  return <Footer />;
}
