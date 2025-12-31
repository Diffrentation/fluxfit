"use client";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/contexts/SidebarContext";

export default function AdminLayout({ children }) {
  // This layout ensures admin pages don't show the footer
  // The footer is conditionally rendered in the root layout
  return <SidebarProvider>{children}</SidebarProvider>;
}
