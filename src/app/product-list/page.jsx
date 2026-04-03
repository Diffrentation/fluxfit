"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
import GetInTouch from "@/components/GetInTouch/GetInTouch";
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
  { value: "0-50", label: "₹0.00 - ₹50.00" },
  { value: "50-100", label: "₹50.00 - ₹100.00" },
  { value: "100-150", label: "₹100.00 - ₹150.00" },
  { value: "150-200", label: "₹150.00 - ₹200.00" },
  { value: "200+", label: "₹200.00+" },
];

function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function getUniqueColorsFromProducts(products) {
  const colorSet = new Set();
  products.forEach((product) => {
    if (product.colors && Array.isArray(product.colors)) {
      product.colors.forEach((c) => colorSet.add(c));
    } else if (product.color) {
      colorSet.add(product.color);
    }
  });
  return Array.from(colorSet).map(
    (c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
  );
}

function getUniqueTagsFromProducts(products) {
  const tagSet = new Set();
  products.forEach((product) => {
    if (product.tags && Array.isArray(product.tags)) {
      product.tags.forEach((tag) => tagSet.add(tag));
    }
  });
  return Array.from(tagSet);
}

function getUniqueCategoriesFromProducts(products) {
  const categorySet = new Set(["All Products"]);
  products.forEach((product) => {
    if (product.category) categorySet.add(product.category);
  });
  return Array.from(categorySet);
}

function ProductListPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [sortBy, setSortBy] = useState("newness");
  const [priceFilter, setPriceFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  const { products, pagination, loading } = usePublicProducts({
    page: 1,
    limit: 48,
    categoryLabel: activeCategory,
    debouncedSearch,
    sortBy,
    priceFilter,
    colorFilter,
    selectedTags,
  });

  const colors = useMemo(
    () => getUniqueColorsFromProducts(products),
    [products]
  );
  const tags = useMemo(() => getUniqueTagsFromProducts(products), [products]);
  const categories = useMemo(
    () => getUniqueCategoriesFromProducts(products),
    [products]
  );

  const handleQuickView = useCallback(
    (product) => {
      const path = getProductDetailPath(product);
      if (path && path !== "/product-list") router.push(path);
    },
    [router]
  );

  const resetFilters = useCallback(() => {
    setActiveCategory("All Products");
    setSortBy("newness");
    setPriceFilter("all");
    setColorFilter(null);
    setSelectedTags([]);
    setSearchQuery("");
  }, []);

  const totalCount = pagination?.total ?? products.length;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-10 transition-colors duration-300">
      <div className="w-full px-0 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 px-3 sm:px-0">
          <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            PRODUCT LIST
          </h1>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 px-3 sm:px-0">
            <CategoryNav
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <div className="flex items-center gap-4 w-full md:w-auto">
              <motion.button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs sm:text-sm font-medium transition-colors text-gray-900 dark:text-white"
              >
                <motion.div
                  animate={{ rotate: showFilters ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {showFilters ? (
                    <IconX className="w-4 h-4" />
                  ) : (
                    <IconFilter className="w-4 h-4" />
                  )}
                </motion.div>
                <span>Filter</span>
              </motion.button>
              <motion.div
                className="relative flex-1 md:flex-initial"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all duration-200 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  aria-label="Search products"
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
              className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 overflow-hidden shadow-sm border-0 sm:border border-gray-200 dark:border-gray-700 mx-0 sm:mx-0"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
                    colors={colors.length > 0 ? colors : ["Black", "White", "Blue"]}
                  />
                  <TagsFilter
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    tags={tags.length > 0 ? tags : ["Fashion", "Lifestyle"]}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-3 sm:px-0">
          Showing {products.length} of {totalCount} products
        </div>

        {loading ? (
          <div className="flex justify-center py-20 px-3">
            <Spin size="large" tip="Loading products..." />
          </div>
        ) : (
          <>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 gap-0 sm:gap-4 md:gap-5 lg:gap-6">
              <AnimatePresence mode="popLayout">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout={false}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    <ProductCard
                      product={product}
                      onQuickView={handleQuickView}
                    />
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
                  className="text-center py-8 sm:py-12"
                >
                  <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-4">
                    No products found matching your filters.
                  </p>
                  <Button onClick={resetFilters} type="primary">
                    Reset Filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <GetInTouch />
    </div>
  );
}

export default ProductListPage;
