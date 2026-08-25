"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { Badge } from "antd";
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
  IconMessageCircle,
  IconPalette,
  IconPhoto,
  IconShirt,
  IconPin,
  IconBrowser,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/context/AuthContext";

const AdminSidebar = ({ activeItem = "dashboard" }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingContacts, setPendingContacts] = useState(0);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { logout } = useAuth();
  const sidebarRef = useRef(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pinned = localStorage.getItem("adminSidebarPinned") === "true";
      setIsPinned(pinned);
      if (pinned && window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    }
  }, [setIsCollapsed]);

  const togglePin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    if (typeof window !== "undefined") {
      localStorage.setItem("adminSidebarPinned", newPinned);
    }
  };

  const fetchPendingContacts = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      setPendingContacts(0);
      return;
    }
    try {
      const { data } = await axios.get("/api/admin/contacts/pending-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.success && typeof data.data?.pending === "number") {
        setPendingContacts(data.data.pending);
      }
    } catch {
      setPendingContacts(0);
    }
  }, []);

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) return;
    fetchPendingContacts();
    const t = setInterval(fetchPendingContacts, 45000);
    const onContactsChanged = () => fetchPendingContacts();
    window.addEventListener("ff-admin-contacts-changed", onContactsChanged);
    return () => {
      clearInterval(t);
      window.removeEventListener("ff-admin-contacts-changed", onContactsChanged);
    };
  }, [pathname, fetchPendingContacts]);

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
      label: "Categories",
      icon: IconTags,
      path: "/admin/categories",
    },
    {
      id: "custom-clothes-designs",
      label: "Custom clothes prints",
      icon: IconPalette,
      path: "/admin/custom-clothes-designs",
    },
    {
      id: "custom-orders",
      label: "Custom Orders",
      icon: IconShirt,
      path: "/admin/custom-orders",
    },
    {
      id: "hero-banners",
      label: "Hero Banners",
      icon: IconPhoto,
      path: "/admin/hero-banners",
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
      id: "reviews",
      label: "Reviews",
      icon: IconMessageCircle,
      path: "/admin/reviews",
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
      id: "contacts",
      label: "Support inbox",
      icon: IconBell,
      path: "/admin/contacts",
      badgeCount: pendingContacts,
    },
    {
      id: "settings",
      label: "Settings",
      icon: IconSettings,
      path: "/admin/settings",
    },
    {
      id: "pages",
      label: "Pages & Content",
      icon: IconBrowser,
      path: "/admin/pages",
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

  // Handle click outside sidebar to collapse it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest("[data-sidebar-toggle]") &&
        window.innerWidth >= 1024 && // Only for desktop
        !isPinned
      ) {
        setIsCollapsed(true);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsCollapsed, isPinned]);

  // Handle sidebar hover to expand (only if collapsed)
  const handleSidebarEnter = () => {
    if (isCollapsed && window.innerWidth >= 1024) {
      setIsCollapsed(false);
    }
  };

  // Handle sidebar hover out to collapse
  const handleSidebarLeave = () => {
    if (window.innerWidth >= 1024 && !isPinned) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-950 dark:bg-zinc-950 text-white rounded-lg shadow-lg hover:bg-zinc-900 dark:hover:bg-zinc-900 transition-colors"
      >
        {mobileMenuOpen ? (
          <IconX className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <IconMenu2 className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        ref={sidebarRef}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 256,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-zinc-950 dark:bg-zinc-950 text-white z-40 hidden lg:block"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <motion.div
            animate={{
              padding: isCollapsed ? "12px 16px" : "24px",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="border-b border-zinc-800 dark:border-zinc-800"
          >
            <motion.div
              animate={{
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="flex items-center gap-2 sm:gap-3 w-full"
            >
              <Link
                href="/admin"
                className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                onClick={handleMenuClose}
              >
                {isCollapsed ? (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden relative shrink-0">
                    <img
                      src="/logo.png"
                      alt="FluxFit Logo"
                      className="h-full w-auto max-w-none absolute left-0 top-0 object-cover object-left"
                    />
                  </div>
                ) : (
                  <div className="h-8 sm:h-10 flex items-center gap-2 min-w-0">
                    <img
                      src="/logo.png"
                      alt="FluxFit Logo"
                      className="h-full w-auto object-contain"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full shrink-0">
                      Admin
                    </span>
                  </div>
                )}
              </Link>
            </motion.div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-hide">
            <ul className="space-y-1 sm:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const badge =
                  item.badgeCount > 0 ? (
                    <Badge
                      count={item.badgeCount}
                      size="small"
                      className="shrink-0 [&_.ant-badge-count]:!min-w-[18px] [&_.ant-badge-count]:!h-[18px] [&_.ant-badge-count]:!leading-[18px] [&_.ant-badge-count]:!text-[10px]"
                    />
                  ) : null;

                return (
                  <li key={item.id} className="relative">
                    <Link
                      href={item.path}
                      onClick={handleMenuClose}
                      className={cn(
                        "flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors text-sm sm:text-base relative group w-full",
                        item.id === "dashboard" && !isCollapsed ? "pr-10" : "", // Add padding for pin icon
                        active
                          ? "bg-white dark:bg-[#1e9a58] text-[#1e9a58] dark:text-white font-semibold"
                          : "text-gray-300 dark:text-gray-400 hover:bg-zinc-900 dark:hover:bg-zinc-900 hover:text-white dark:hover:text-white"
                      )}
                      title={isCollapsed ? item.label : ""}
                    >
                      <div
                        className={`flex items-center gap-2 sm:gap-3 min-w-0 flex-1 ${isCollapsed ? "justify-center" : "justify-start"}`}
                      >
                        <span className="relative inline-flex shrink-0">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                          {isCollapsed && item.badgeCount > 0 ? (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                              {item.badgeCount > 99 ? "99+" : item.badgeCount}
                            </span>
                          ) : null}
                        </span>
                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                              className="whitespace-nowrap overflow-hidden flex items-center gap-2 min-w-0"
                            >
                              <span className="truncate">{item.label}</span>
                              {badge}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          {item.label}
                        </div>
                      )}
                    </Link>

                    {/* Pin button for Dashboard item */}
                    <AnimatePresence>
                      {item.id === "dashboard" && !isCollapsed && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          onClick={togglePin}
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors z-10",
                            isPinned 
                              ? "bg-[#1e9a58]/20 text-[#1e9a58] hover:bg-[#1e9a58]/30" 
                              : "text-gray-400 hover:text-white hover:!bg-zinc-950"
                          )}
                          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                        >
                          <IconPin className={cn("w-4 h-4 sm:w-5 sm:h-5", isPinned && "fill-current")} stroke={isPinned ? 2 : 1.5} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout — icon-only when collapsed so the rail always stays visible */}
          <div className="border-t border-zinc-800 dark:border-zinc-800 overflow-hidden mt-auto shrink-0">
            {isCollapsed ? (
              <div className="p-2 sm:p-3 flex justify-center">
                <button
                  type="button"
                  onClick={logout}
                  title="Log out"
                  className="flex items-center justify-center p-2 sm:p-3 rounded-xl text-gray-300 dark:text-gray-400 hover:bg-zinc-900 dark:hover:bg-zinc-900 hover:text-white w-full transition-colors"
                >
                  <IconLogout className="w-5 h-5 shrink-0" />
                </button>
              </div>
            ) : (
              <div className="p-3 sm:p-4">
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-gray-300 dark:text-gray-400 hover:bg-zinc-900 dark:hover:bg-zinc-900 hover:text-white dark:hover:text-white w-full transition-colors text-sm sm:text-base"
                >
                  <IconLogout className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="whitespace-nowrap overflow-hidden">Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

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
              className="fixed left-0 top-0 h-screen w-56 sm:w-64 bg-zinc-950 dark:bg-zinc-950 text-white z-50 lg:hidden transition-colors duration-300"
            >
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-4 sm:p-6 border-b border-zinc-800 dark:border-zinc-800">
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 sm:gap-3"
                    onClick={handleMenuClose}
                  >
                    <img
                      src="/logo.png"
                      alt="FluxFit Logo"
                      className="h-8 sm:h-10 w-auto object-contain"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full shrink-0">
                      Admin
                    </span>
                  </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-hide">
                  <ul className="space-y-1 sm:space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const mobileBadge =
                        item.badgeCount > 0 ? (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {item.badgeCount > 99 ? "99+" : item.badgeCount}
                          </span>
                        ) : null;

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.path}
                            onClick={handleMenuClose}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors text-sm sm:text-base",
                              active
                                ? "bg-white dark:bg-[#1e9a58] text-[#1e9a58] dark:text-white font-semibold"
                                : "text-gray-300 dark:text-gray-400 hover:bg-zinc-900 dark:hover:bg-zinc-900 hover:text-white dark:hover:text-white"
                            )}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            <span className="flex-1 min-w-0 truncate">
                              {item.label}
                            </span>
                            {mobileBadge}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Logout */}
                <div className="p-3 sm:p-4 border-t border-zinc-800 dark:border-zinc-800">
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-gray-300 dark:text-gray-400 hover:bg-zinc-900 dark:hover:bg-zinc-900 hover:text-white dark:hover:text-white w-full transition-colors text-sm sm:text-base"
                  >
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
