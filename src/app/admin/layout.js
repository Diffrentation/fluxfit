"use client";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AdminSidebar from "@/components/Admin/AdminSidebar";

export default function AdminLayout({ children }) {
  // This layout ensures admin pages don't show the footer
  // The footer is conditionally rendered in the root layout
  return (
    <SidebarProvider>
      <AdminSidebar />
      {children}
    </SidebarProvider>
  );
}
