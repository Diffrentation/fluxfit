"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import { useAuth } from "@/context/AuthContext";

// Maps the real /api/recently-viewed product shape to what ProductCard expects.
function mapToCardProduct(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.basePrice,
    originalPrice: p.originalPrice,
    discount: p.discount,
    image: p.image,
    images: p.image ? [p.image] : [],
    inStock: p.inStock,
    stock: p.stock,
  };
}

function RecentlyViewedProducts() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [recentProducts, setRecentProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate how many products to show based on screen size
  const getProductsPerView = () => {
    if (typeof window === "undefined") return 4;
    const width = window.innerWidth;
    if (width < 640) return 1; // Mobile
    if (width < 1024) return 2; // Tablet
    if (width < 1280) return 3; // Small desktop
    return 4; // Large desktop
  };

  const [productsPerView, setProductsPerView] = useState(getProductsPerView());

  // Load recently viewed products from the server (per-account, not per-browser).
  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentProducts([]);
      return;
    }
    let cancelled = false;
    axios
      .get("/api/recently-viewed?limit=8")
      .then(({ data }) => {
        if (cancelled || !data?.success) return;
        setRecentProducts((data.data.products || []).map(mapToCardProduct));
      })
      .catch(() => {
        if (!cancelled) setRecentProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleResize = () => {
      setProductsPerView(getProductsPerView());
      setCurrentIndex(0); // Reset to start when resizing
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Don't render if no products - MUST be after all hooks
  if (recentProducts.length === 0) {
    return null;
  }

  const handleQuickView = (product) => {
    router.push(`/product-details/${product.id}`);
  };

  const maxIndex = Math.max(0, recentProducts.length - productsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section className="w-full bg-transparent py-8 sm:py-10 md:py-12 lg:py-14 transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
            >
              <IconClock className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Recently Viewed Products
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                Continue browsing your favorite items
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          {recentProducts.length > productsPerView && (
            <div className="hidden md:flex items-center gap-2">
              <motion.button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
                  currentIndex === 0
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 shadow-md"
                }`}
                aria-label="Previous products"
              >
                <IconChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentIndex >= maxIndex
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 shadow-md"
                }`}
                aria-label="Next products"
              >
                <IconChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Products Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
            >
              {recentProducts
                .slice(currentIndex, currentIndex + productsPerView)
                .map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                  >
                    <ProductCard
                      product={product}
                      onQuickView={handleQuickView}
                    />
                  </motion.div>
                ))}
            </motion.div>
          </AnimatePresence>

          {/* Mobile Navigation */}
          {recentProducts.length > productsPerView && (
            <div className="md:hidden flex items-center justify-center gap-4 mt-6">
              <motion.button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 sm:p-2 rounded-full ${
                  currentIndex === 0
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md"
                }`}
                aria-label="Previous products"
              >
                <IconChevronLeft className="w-4 h-4" />
              </motion.button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "w-8 bg-blue-600 dark:bg-blue-500"
                        : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <motion.button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${
                  currentIndex >= maxIndex
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md"
                }`}
                aria-label="Next products"
              >
                <IconChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        {/* View All Link (if more products than visible) */}
        {recentProducts.length > productsPerView && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center mt-8"
          >
            <motion.button
              onClick={() => router.push("/product-list")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
            >
              View All Products
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default RecentlyViewedProducts;
