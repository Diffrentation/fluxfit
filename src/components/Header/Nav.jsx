"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useMemo, useState, useEffect, useRef } from "react";
import { IconShoppingCart, IconUser, IconChevronDown, IconLogout } from "@tabler/icons-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Dropdown, Avatar } from "antd";
import ChallengeBanner from "@/components/Banner/ChallengeBanner";

export function Nav() {
  const { user, hydrated, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isUserViewMode, setIsUserViewMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsUserViewMode(localStorage.getItem("admin_user_view_mode") === "true");
    }
  }, [pathname]);

  const desktopNavItems = useMemo(() => {
    const items = [
      { name: "Home", link: "/" },
      { name: "Shop", link: "/product-list" },
      { name: "Custom clothes", link: "/custom-clothes?reset=true" },
      { name: "Orders", link: "/orders" },
      { name: "5K Challenge", link: "/5k-challenge" },
      { name: "About", link: "/about" },
      { name: "Contact", link: "/contact" },
    ];
    return items;
  }, [hydrated, user?.role]);

  const mobileNavItems = useMemo(() => {
    const items = [
      { name: "Home", link: "/" },
      { name: "Shop", link: "/product-list" },
      { name: "Custom clothes", link: "/custom-clothes?reset=true" },
      { name: "About", link: "/about" },
      { name: "5K Challenge", link: "/5k-challenge" },
      { name: "Contact", link: "/contact" },
      { name: "Cart", link: "/cart" },
      { name: "Orders", link: "/orders" },
    ];
    return items;
  }, [hydrated, user?.role]);

  const displayName = useMemo(() => {
    if (!user) return "";
    const full = [user.firstname, user.lastname].filter(Boolean).join(" ").trim();
    if (full) return full;
    return user.username || user.email || "Account";
  }, [user]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const router = useRouter();



  const showAuthChrome = hydrated && isAuthenticated && user;

  if (pathname?.startsWith("/admin") || (hydrated && user?.role === "admin" && !isUserViewMode)) {
    return null;
  }

  return (
    <div className="relative w-full">
      <Navbar>
        <ChallengeBanner />
        <NavBody>
          <NavbarLogo />
          <NavItems items={desktopNavItems} />
          <div className="flex items-center gap-2 xl:gap-4">
            {!showAuthChrome ? (
              <>
                <NavbarButton
                  onClick={() => router.push("/auth/login")}
                  variant="secondary"
                >
                  Login
                </NavbarButton>
                <NavbarButton
                  onClick={() => router.push("/auth/register")}
                  variant="outline-green"
                >
                  Register
                </NavbarButton>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 text-sm font-semibold text-black hover:bg-[#f4fbf7] transition-colors border border-transparent hover:border-[#eaf5ef]"
                >
                  <Avatar
                    size={36}
                    src={user.profileimage || undefined}
                    icon={!user.profileimage ? <IconUser className="h-5 w-5" /> : undefined}
                    className="shrink-0"
                  />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <IconChevronDown className={`h-4 w-4 text-gray-400 transition-transform hidden sm:block ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-50 mb-2 bg-gray-50/50 mx-2 rounded-lg">
                        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email || `@${user.username}`}</p>
                      </div>
                      
                      <button 
                        onClick={() => { setIsDropdownOpen(false); router.push("/profile"); }} 
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-[#f4fbf7] hover:text-[#1e9a58] flex items-center gap-2.5 transition-colors"
                      >
                        <div className="bg-gray-50 p-1.5 rounded-md text-gray-500 group-hover:text-[#1e9a58] group-hover:bg-[#eaf5ef] transition-colors">
                          <IconUser className="w-4 h-4" />
                        </div>
                        My Profile
                      </button>

                      <div className="h-px bg-gray-100 my-2 mx-4"></div>

                      <button 
                        onClick={() => { setIsDropdownOpen(false); logout(); }} 
                        className="group w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                      >
                        <div className="bg-red-50 p-1.5 rounded-md text-red-500 group-hover:bg-red-100 transition-colors">
                          <IconLogout className="w-4 h-4" />
                        </div>
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <Link href="/cart" className="inline-block">
              <NavbarButton
                variant="primary"
                className="flex items-center gap-2 relative"
                as="span"
              >
                <div className="relative">
                  <IconShoppingCart className="h-5 w-5" />
                  <AnimatePresence mode="wait">
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg"
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                Cart
              </NavbarButton>
            </Link>
            {isAuthenticated && isUserViewMode && (
              <NavbarButton
                onClick={() => {
                  localStorage.removeItem("admin_user_view_mode");
                  setIsUserViewMode(false);
                  router.push("/admin");
                }}
                variant="secondary"
                className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20"
              >
                <IconLogout className="w-4 h-4" />
                <span className="hidden sm:inline">Exit View</span>
              </NavbarButton>
            )}
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-2">
              <Link
                href="/5k-challenge"
                className="rounded-md border border-[#1e9a58] px-2.5 py-1.5 text-xs font-bold text-[#1e9a58] transition-colors hover:bg-[#1e9a58] hover:text-white"
              >
                5K Challenge
              </Link>
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {mobileNavItems.map((item, idx) => {
              const active = item.link === "/" ? pathname === "/" : pathname?.startsWith(item.link.split('?')[0]);
              return (
                <Link
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`relative w-full py-2 px-3 text-[13px] sm:text-[14px] font-medium transition-colors border-b border-gray-100/50 last:border-0 ${
                    active 
                      ? 'text-[#1e9a58] bg-[#f4fbf7] border-l-[3px] border-l-[#1e9a58]' 
                      : 'text-neutral-600 hover:text-[#1e9a58] hover:bg-gray-50/50 dark:text-neutral-300 border-l-[3px] border-l-transparent'
                  }`}
                >
                  <span className="block">{item.name}</span>
                </Link>
              );
            })}
            <div className="flex w-full flex-col gap-1.5 pt-2 pb-0 mt-auto border-t border-neutral-100 dark:border-neutral-700">
              {!showAuthChrome ? (
                <>
                  <NavbarButton
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/auth/login");
                    }}
                    variant="primary"
                    className="w-full h-[36px] flex items-center justify-center text-[12px] sm:text-[13px] rounded-lg font-bold"
                  >
                    Login
                  </NavbarButton>
                  <NavbarButton
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/auth/register");
                    }}
                    variant="primary"
                    className="w-full h-[36px] flex items-center justify-center text-[12px] sm:text-[13px] rounded-lg font-bold"
                  >
                    Register
                  </NavbarButton>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-1 py-2">
                    <Avatar
                      size={40}
                      src={user.profileimage || undefined}
                      icon={!user.profileimage ? <IconUser className="h-6 w-6" /> : undefined}
                    />
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {displayName}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    className="text-neutral-700 dark:text-neutral-300 text-sm py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <NavbarButton
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    variant="secondary"
                    className="w-full h-[36px] flex items-center justify-center text-[12px] sm:text-[13px] rounded-lg font-bold text-red-600 border border-red-100 hover:bg-red-50"
                  >
                    Logout
                  </NavbarButton>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      <DummyContent />
    </div>
  );
}

const DummyContent = () => {
  return <div className="container"></div>;
};
