"use client";

import React, { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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

/** Avoid static prerender issues with useSearchParams + ensure build succeeds */
export const dynamic = "force-dynamic";

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

function ProductListPageContent() {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get("category"); // backend slug or id
  const urlSortBy = searchParams.get("sort") || "newness";
  const urlColor = searchParams.get("color");
  const urlMinPrice = searchParams.get("minPrice");
  const urlMaxPrice = searchParams.get("maxPrice");
  const urlSearch = searchParams.get("search") || "";

  const priceFilterFromUrl = useMemo(() => {
    const min = urlMinPrice != null ? parseFloat(urlMinPrice) : null;
    const max = urlMaxPrice != null ? parseFloat(urlMaxPrice) : null;
    if (min == null && max == null) return "all";

    const options = ["0-50", "50-100", "100-150", "150-200", "200+"];
    for (const v of options) {
      if (v.endsWith("+")) {
        const targetMin = parseFloat(v.replace("+", ""));
        if (Number.isFinite(min) && min === targetMin && max == null) return v;
      } else {
        const [a, b] = v.split("-").map((x) => parseFloat(x));
        if (
          Number.isFinite(min) &&
          Number.isFinite(max) &&
          min === a &&
          max === b
        ) {
          return v;
        }
      }
    }
    return "all";
  }, [urlMinPrice, urlMaxPrice]);

  const [searchInput, setSearchInput] = useState(urlSearch);

  // If the user navigates (back/forward) or reloads, sync the input.
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 400);

  const updateUrlParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const { products, pagination, loading } = usePublicProducts({
    page: 1,
    limit: 48,
    category: urlCategory,
    debouncedSearch,
    sortBy: urlSortBy,
    priceFilter: priceFilterFromUrl,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    colorFilter: urlColor,
    selectedTags,
  });

  const colors = useMemo(() => getUniqueColorsFromProducts(products), [products]);
  const tags = useMemo(() => getUniqueTagsFromProducts(products), [products]);

  const colorOptions = useMemo(() => {
    const base = colors.length > 0 ? colors : ["Black", "White", "Blue"];
    if (!urlColor) return base;
    return base.includes(urlColor) ? base : [...base, urlColor];
  }, [colors, urlColor]);

  const handleQuickView = useCallback(
    (product) => {
      const path = getProductDetailPath(product);
      if (path && path !== "/product-list") router.push(path);
    },
    [router]
  );

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setSelectedTags([]);
    // Clear URL query params
    router.replace(pathname);
  }, [pathname, router]);

  // Keep URL in sync for `search` (debounced).
  useEffect(() => {
    const next = debouncedSearch || "";
    if ((urlSearch || "") === next) return;
    updateUrlParams({ search: next || null });
  }, [debouncedSearch, updateUrlParams, urlSearch]);

  const totalCount =
    pagination?.total != null ? pagination.total : (Array.isArray(products) ? products.length : 0);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-10 transition-colors duration-300">
      <div className="w-full px-0 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 px-3 sm:px-0">
          <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            PRODUCT LIST
          </h1>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 px-3 sm:px-0">
            <CategoryNav
              activeCategory={urlCategory}
              onCategoryChange={(categoryIdOrNull) =>
                updateUrlParams({ category: categoryIdOrNull || null })
              }
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {(urlMinPrice || urlMaxPrice) && (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium">
                      Price: ₹{urlMinPrice || "0"}
                      {urlMaxPrice ? ` - ₹${urlMaxPrice}` : "+"}
                    </span>
                  )}
                  {urlColor && (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium">
                      Color: {urlColor}
                    </span>
                  )}
                  {urlSearch && (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium">
                      Search: &quot;{urlSearch}&quot;
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <SortByFilter
                    value={urlSortBy}
                    onChange={(v) => updateUrlParams({ sort: v })}
                    options={sortOptions}
                  />
                  <PriceFilter
                    value={priceFilterFromUrl}
                    onChange={(v) => {
                      if (v === "all") {
                        updateUrlParams({ minPrice: null, maxPrice: null });
                        return;
                      }
                      if (v.endsWith("+")) {
                        const min = parseFloat(v.replace("+", ""));
                        updateUrlParams({ minPrice: min, maxPrice: null });
                        return;
                      }
                      const [min, max] = v.split("-").map((x) => parseFloat(x));
                      updateUrlParams({ minPrice: min, maxPrice: max });
                    }}
                    options={priceOptions}
                  />
                  <ColorFilter
                    value={urlColor}
                    onChange={(c) => updateUrlParams({ color: c || null })}
                    colors={colorOptions}
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
                {(Array.isArray(products) ? products : []).map((product, index) => (
                  <motion.div
                    key={product?.id ?? index}
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

function ProductListFallback() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-10 flex justify-center items-center">
      <Spin size="large" tip="Loading..." />
    </div>
  );
}

export default function ProductListPage() {
  return (
    <Suspense fallback={<ProductListFallback />}>
      <ProductListPageContent />
    </Suspense>
  );
}
