"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconLayoutDashboard,
  IconShoppingBag,
  IconPackage,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconBell,
  IconHelp,
  IconFileText,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const AdminSidebar = ({ activeItem = "dashboard" }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: IconLayoutDashboard,
      path: "/admin",
    },
    {
      id: "products",
      label: "Products",
      icon: IconPackage,
      path: "/admin/products",
    },
    {
      id: "orders",
      label: "Orders",
      icon: IconShoppingBag,
      path: "/admin/orders",
    },
    {
      id: "customers",
      label: "Customers",
      icon: IconUsers,
      path: "/admin/customers",
    },
    {
      id: "reports",
      label: "Reports",
      icon: IconFileText,
      path: "/admin/reports",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: IconChartBar,
      path: "/admin",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: IconBell,
      path: "/admin/notifications",
    },
    {
      id: "help",
      label: "Help",
      icon: IconHelp,
      path: "/admin/help",
    },
    {
      id: "settings",
      label: "Settings",
      icon: IconSettings,
      path: "/admin/settings",
    },
  ];

  const isActive = (itemPath) => {
    if (itemPath === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(itemPath);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">F</span>
          </div>
          <span className="text-xl font-bold">FluxFit Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.id}>
                <Link
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    active
                      ? "bg-white text-gray-900 font-semibold"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors">
          <IconLogout className="w-5 h-5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <IconX className="w-6 h-6" /> : <IconMenu2 className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white z-40 hidden lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;

