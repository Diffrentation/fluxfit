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
  IconTag,
  IconTags,
  IconCreditCard,
  IconCurrencyRupee,
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
      id: "categories",
      label: "Categories & Brands",
      icon: IconTags,
      path: "/admin/categories",
    },
    {
      id: "orders",
      label: "Orders",
      icon: IconShoppingBag,
      path: "/admin/orders",
    },
    {
      id: "users",
      label: "Users",
      icon: IconUsers,
      path: "/admin/users",
    },
    {
      id: "coupons",
      label: "Coupons & Offers",
      icon: IconTag,
      path: "/admin/coupons",
    },
    {
      id: "payments",
      label: "Payments & Finance",
      icon: IconCreditCard,
      path: "/admin/payments",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: IconChartBar,
      path: "/admin",
    },
    {
      id: "reports",
      label: "Reports",
      icon: IconFileText,
      path: "/admin/reports",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: IconBell,
      path: "/admin/notifications",
    },
    {
      id: "settings",
      label: "Settings",
      icon: IconSettings,
      path: "/admin/settings",
    },
    {
      id: "help",
      label: "Help",
      icon: IconHelp,
      path: "/admin/help",
    },
  ];

  const isActive = (itemPath) => {
    if (itemPath === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(itemPath);
  };

  const handleMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      >
        {mobileMenuOpen ? (
          <IconX className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <IconMenu2 className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 sm:w-64 bg-gray-900 dark:bg-gray-800 text-white z-40 hidden lg:block transition-colors duration-300">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-gray-800 dark:border-gray-700">
            <Link
              href="/admin"
              className="flex items-center gap-2 sm:gap-3"
              onClick={handleMenuClose}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-white">
                  F
                </span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white dark:text-white">
                FluxFit Admin
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
            <ul className="space-y-1 sm:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      onClick={handleMenuClose}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base",
                        active
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                          : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white dark:hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-3 sm:p-4 border-t border-gray-800 dark:border-gray-700">
            <button className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white dark:hover:text-white w-full transition-colors text-sm sm:text-base">
              <IconLogout className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleMenuClose}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-56 sm:w-64 bg-gray-900 dark:bg-gray-800 text-white z-50 lg:hidden transition-colors duration-300"
            >
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-4 sm:p-6 border-b border-gray-800 dark:border-gray-700">
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 sm:gap-3"
                    onClick={handleMenuClose}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-bold text-white">
                        F
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-white dark:text-white">
                      FluxFit Admin
                    </span>
                  </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
                  <ul className="space-y-1 sm:space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.path}
                            onClick={handleMenuClose}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base",
                              active
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                                : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white dark:hover:text-white"
                            )}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Logout */}
                <div className="p-3 sm:p-4 border-t border-gray-800 dark:border-gray-700">
                  <button className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white dark:hover:text-white w-full transition-colors text-sm sm:text-base">
                    <IconLogout className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
