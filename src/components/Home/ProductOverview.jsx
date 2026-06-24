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
  IconShoppingCart
} from "@tabler/icons-react";
import { Button, Spin } from "antd";
import { useRouter } from "next/navigation";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { getProductDetailPath } from "@/lib/publicProductsApi";
import { useDebounce } from "@/hooks/useDebounce";

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

function ProductOverview() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState("newness");
  const [priceFilter, setPriceFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery.trim(), 400);

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
    <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-10 sm:py-16 bg-transparent overflow-hidden">
      
      {/* Background Decor Elements matching the screenshot */}
      <div className="absolute top-10 right-10 grid grid-cols-4 gap-3 opacity-20 pointer-events-none z-0">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full"></div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[300px] pointer-events-none opacity-40 z-0">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
          <path fill="#e0f2fe" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="#bae6fd" fillOpacity="0.5" d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,213C672,213,768,203,864,197.3C960,192,1056,192,1152,208C1248,224,1344,256,1392,272L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <div className="relative z-10 w-full">
        <div className="mb-8 relative z-50">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e4f7ed] border border-[#bbf0d4] rounded-md mb-4 shadow-sm">
            <IconShoppingCart size={14} className="text-[#1B8A4D]" />
            <span className="text-[#1B8A4D] text-xs font-bold tracking-wider">EXPLORE OUR COLLECTION</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0d1c2f] to-[#1e3c72] mb-8 tracking-tight uppercase">
            PRODUCT LIST
          </h1>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 border-b border-gray-200/60 pb-4">
            <div className="w-full lg:flex-1 pb-2 lg:pb-0">
              <CategoryNav
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <motion.button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 hover:border-green-400 rounded-full text-sm font-bold transition-colors text-green-600 shadow-sm whitespace-nowrap"
              >
                <IconFilter className="w-4 h-4 text-green-500" />
                <span>Filter</span>
              </motion.button>
              
              <div className="relative flex-1 lg:w-[280px]">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-green-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1e9a58] transition-all bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-400 shadow-sm"
                />
              </div>
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
              className="bg-white rounded-2xl mb-8 shadow-md border border-gray-100 overflow-hidden relative"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#e4f7ed] rounded-full flex items-center justify-center">
                      <IconFilter className="w-6 h-6 text-[#1B8A4D]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#0d1c2f]">Filters</h2>
                      <p className="text-sm text-gray-500">Refine your search to find exactly what you're looking for.</p>
                    </div>
                  </div>
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 font-semibold text-blue-500 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    <IconRefresh className="w-4 h-4" />
                    Reset Filters
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
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

                {/* Footer */}
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#e4f7ed] rounded-full flex items-center justify-center">
                      <IconFilter className="w-5 h-5 text-[#1B8A4D]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0d1c2f]">Filters Applied</h3>
                      <p className="text-xs text-gray-500">Showing results based on your preferences</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold transition-colors"
                  >
                    <IconFilter className="w-4 h-4" />
                    Show Results
                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">{products.length}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-start pt-20 rounded-2xl">
              <Spin size="large" />
              <span className="text-sm font-semibold text-[#64748b] mt-4">
                Updating products...
              </span>
            </div>
          )}
          
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8 relative z-10"
          >
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  }}
                >
                  <ProductCard product={product} onQuickView={handleQuickView} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {!loading && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="text-center py-20 bg-white/50 backdrop-blur rounded-2xl mt-4 border border-gray-100"
              >
                <p className="text-[#64748b] font-medium text-lg">
                  No products found matching your filters.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ProductOverview;
