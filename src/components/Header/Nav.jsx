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
import { useMemo, useState } from "react";
import { IconShoppingCart, IconUser, IconChevronDown } from "@tabler/icons-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dropdown, Avatar } from "antd";

export function Nav() {
  const { user, hydrated, isAuthenticated, logout } = useAuth();

  const desktopNavItems = useMemo(() => {
    const items = [
      { name: "Home", link: "/" },
      { name: "Shop", link: "/product-list" },
      { name: "Custom clothes", link: "/custom-clothes" },
      { name: "Orders", link: "/orders" },
      { name: "About", link: "/about" },
      { name: "Contact", link: "/contact" },
    ];
    if (hydrated && user?.role === "admin") {
      items.push({ name: "Admin", link: "/admin" });
    }
    return items;
  }, [hydrated, user?.role]);

  const mobileNavItems = useMemo(() => {
    const items = [
      { name: "Home", link: "/" },
      { name: "Shop", link: "/product-list" },
      { name: "Custom clothes", link: "/custom-clothes" },
      { name: "About", link: "/about" },
      { name: "Contact", link: "/contact" },
      { name: "Cart", link: "/cart" },
      { name: "Orders", link: "/orders" },
    ];
    if (hydrated && user?.role === "admin") {
      items.push({ name: "Admin", link: "/admin" });
    }
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

  const profileMenu = {
    items: [
      {
        key: "profile",
        label: "My Profile",
        onClick: () => {
          router.push("/profile");
          setIsMobileMenuOpen(false);
        },
      },
      { type: "divider" },
      {
        key: "logout",
        label: "Logout",
        danger: true,
        onClick: () => {
          setIsMobileMenuOpen(false);
          logout();
        },
      },
    ],
  };

  const showAuthChrome = hydrated && isAuthenticated && user;

  return (
    <div className="relative w-full">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={desktopNavItems} />
          <div className="flex items-center gap-2 sm:gap-4">
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
                  variant="primary"
                >
                  Register
                </NavbarButton>
              </>
            ) : (
              <Dropdown
                menu={profileMenu}
                trigger={["click"]}
                placement="bottomRight"
              >
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
                  <IconChevronDown className="h-4 w-4 opacity-70 hidden sm:block" />
                </button>
              </Dropdown>
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
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {mobileNavItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </Link>
            ))}
            <div className="flex w-full flex-col gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              {!showAuthChrome ? (
                <>
                  <NavbarButton
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/auth/login");
                    }}
                    variant="primary"
                    className="w-full"
                  >
                    Login
                  </NavbarButton>
                  <NavbarButton
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/auth/register");
                    }}
                    variant="primary"
                    className="w-full"
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
                    className="w-full"
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
