"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import { getRecentlyViewedProducts } from "@/lib/recentlyViewed";
import { productDatabase } from "@/lib/productDatabase";

function RecentlyViewedProducts() {
  const router = useRouter();
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

  // Load recently viewed products
  useEffect(() => {
    const loadRecentProducts = () => {
      const products = getRecentlyViewedProducts(productDatabase);
      setRecentProducts(products);
    };

    loadRecentProducts();

    // Listen for storage changes (when products are viewed in other tabs)
    const handleStorageChange = () => {
      loadRecentProducts();
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for changes in the same tab
    const interval = setInterval(loadRecentProducts, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
    <section className="w-full bg-gray-50 py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8 md:mb-12"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-2 bg-blue-100 rounded-lg"
            >
              <IconClock className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                Recently Viewed Products
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">
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
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentIndex === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md"
                }`}
                aria-label="Previous products"
              >
                <IconChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentIndex >= maxIndex
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md"
                }`}
                aria-label="Next products"
              >
                <IconChevronRight className="w-5 h-5" />
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
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
                className={`p-2 rounded-full ${
                  currentIndex === 0
                    ? "bg-gray-200 text-gray-400"
                    : "bg-white text-gray-700 shadow-md"
                }`}
                aria-label="Previous products"
              >
                <IconChevronLeft className="w-5 h-5" />
              </motion.button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "w-8 bg-blue-600"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
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
                    ? "bg-gray-200 text-gray-400"
                    : "bg-white text-gray-700 shadow-md"
                }`}
                aria-label="Next products"
              >
                <IconChevronRight className="w-5 h-5" />
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
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
