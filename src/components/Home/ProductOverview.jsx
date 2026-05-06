"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";
import CategoryNav from "@/components/ui/CategoryNav";
import SortByFilter from "@/components/ui/SortByFilter";
import PriceFilter from "@/components/ui/PriceFilter";
import ColorFilter from "@/components/ui/ColorFilter";
import TagsFilter from "@/components/ui/TagsFilter";
import {
  IconX,
  IconSearch,
  IconFilter,
  IconRefresh,
} from "@tabler/icons-react";
import { Button, Spin } from "antd";
import { useRouter } from "next/navigation";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { getProductDetailPath } from "@/lib/publicProductsApi";

const sortOptions = [
  { value: "default", label: "Default" },
  { value: "newness", label: "Newness" },
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Average rating" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const priceOptions = [
  { value: "all", label: "All" },
  { value: "0-2000", label: "₹0 - ₹2,000" },
  { value: "2000-5000", label: "₹2,000 - ₹5,000" },
  { value: "5000-8000", label: "₹5,000 - ₹8,000" },
  { value: "8000-10000", label: "₹8,000 - ₹10,000" },
  { value: "10000+", label: "₹10,000+" },
];

const colors = ["Black", "Grey", "Green", "Red", "Blue", "White"];
const tags = ["Fashion", "Lifestyle", "Denim", "Streetstyle", "Crafts"];
// CategoryNav pulls categories from the backend; no hardcoded category list needed.

/** Debounce search input to limit GET /api/products calls while typing */
function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function ProductOverview() {
  const router = useRouter();
  // backend category `slug` or null for "All Products"
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState("newness");
  const [priceFilter, setPriceFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  const { products, pagination, loading } = usePublicProducts({
    page: 1,
    limit: 24,
    category: activeCategory,
    debouncedSearch,
    sortBy,
    priceFilter,
    colorFilter,
    selectedTags,
  });

  const handleQuickView = useCallback(
    (product) => {
      const path = getProductDetailPath(product);
      if (path && path !== "/product-list") router.push(path);
    },
    [router]
  );

  const resetFilters = useCallback(() => {
    setActiveCategory(null);
    setSortBy("newness");
    setPriceFilter("all");
    setColorFilter(null);
    setSelectedTags([]);
    setSearchQuery("");
  }, []);

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          PRODUCT OVERVIEW
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-full sm:flex-1">
            <CategoryNav
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs font-medium transition-colors text-gray-900 dark:text-gray-100"
              suppressHydrationWarning
            >
              <motion.div
                animate={{ rotate: showFilters ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {showFilters ? (
                  <IconX className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <IconFilter className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </motion.div>
              <span className="hidden sm:inline">Filter</span>
            </motion.button>
            <motion.div
              className="relative flex-1 sm:flex-none"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <IconSearch className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
              <input
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto pl-7 sm:pl-8 pr-2.5 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                aria-label="Search products"
                suppressHydrationWarning
              />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-5 mb-6 overflow-hidden"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Filters
                </h2>
                <Button
                  size="small"
                  onClick={resetFilters}
                  className="flex items-center gap-2"
                  icon={<IconRefresh className="w-4 h-4" />}
                >
                  Reset Filters
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <SortByFilter
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                />
                <PriceFilter
                  value={priceFilter}
                  onChange={setPriceFilter}
                  options={priceOptions}
                />
                <ColorFilter
                  value={colorFilter}
                  onChange={setColorFilter}
                  colors={colors}
                />
                <TagsFilter
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  tags={tags}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pagination && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
          Showing {products.length} of {pagination.total} products
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Spin size="large" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading products…
          </span>
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                >
                  <ProductCard product={product} onQuickView={handleQuickView} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8 sm:py-10"
              >
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  No products found matching your filters.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default ProductOverview;
