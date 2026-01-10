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
import { useState } from "react";
import { IconShoppingCart } from "@tabler/icons-react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Herobanner from "../Home/Herobanner.jsx";
import { useRouter } from "next/navigation";

export function Nav() {
  // ecommerce navbar items for desktop (without Cart)
  const desktopNavItems = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Shop",
      link: "/product-list",
    },
    {
      name: "Orders",
      link: "/orders",
    },
    {
      name: "About",
      link: "/about",
    },
    {
      name: "Contact",
      link: "/contact",
    },
    {
      name: "Admin",
      link: "/admin",
    },
  ];

  // ecommerce navbar items for mobile (with Cart)
  const mobileNavItems = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Shop",
      link: "/product-list",
    },
    {
      name: "About",
      link: "/about",
    },
    {
      name: "Contact",
      link: "/contact",
    },
    {
      name: "Cart",
      link: "/cart",
    },
    {
      name: "Orders",
      link: "/orders",
    },
    {
      name: "Admin",
      link: "/admin",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const router = useRouter();
  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={desktopNavItems} />
          <div className="flex items-center gap-4">
            <NavbarButton onClick={() => router.push("/auth/login")} variant="secondary">Login</NavbarButton>
            <NavbarButton onClick={() => router.push("/auth/register")} variant="primary">Register</NavbarButton>
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

        {/* Mobile Navigation */}
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
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Register
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      <DummyContent />
      {/* Navbar */}
    </div>
  );
}

const DummyContent = () => {
  return <div className="container"></div>;
};
