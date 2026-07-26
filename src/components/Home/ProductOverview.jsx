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

  const hasFilters = sortBy !== "newness" || priceFilter !== "all" || colorFilter !== null || selectedTags.length > 0;

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (showFilters && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showFilters]);

  // The reusable Filter Panel content for both Desktop Sidebar and Mobile Drawer
  const FilterContent = (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#e4f7ed] rounded-full flex items-center justify-center">
            <IconFilter className="w-3.5 h-3.5 text-[#1e9a58]" />
          </div>
          <h2 className="text-[14px] font-extrabold text-[#0d1c2f]">Filters</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setShowFilters(false)}
            className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IconX className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Scrollable Filters */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-4 mt-2">
          <SortByFilter value={sortBy} onChange={setSortBy} options={sortOptions} />
          <PriceFilter value={priceFilter} onChange={setPriceFilter} options={priceOptions} />
          <ColorFilter value={colorFilter} onChange={setColorFilter} colors={colors} />
          <TagsFilter selectedTags={selectedTags} onChange={setSelectedTags} tags={tags} />
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 z-20 bg-white border-t border-gray-100 p-3 shrink-0 flex justify-end gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button
          onClick={resetFilters}
          className="w-full lg:w-[130px] h-[36px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 font-bold text-[13px] hover:bg-gray-50 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => setShowFilters(false)}
          className="w-full lg:w-[130px] h-[36px] flex items-center justify-center rounded-lg bg-[#1e9a58] text-white font-bold text-[13px] hover:bg-[#188149] transition-colors shadow-sm"
        >
          Apply Filters
        </button>
      </div>
    </>
  );

  return (
    <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 md:py-16 bg-transparent overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-10 right-0 overflow-hidden w-20 h-20 opacity-20 pointer-events-none z-0 hidden sm:block">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-blue-500 rounded-full"></div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[300px] pointer-events-none opacity-40 z-0">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
          <path fill="#e0f2fe" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="#bae6fd" fillOpacity="0.5" d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,213C672,213,768,203,864,197.3C960,192,1056,192,1152,208C1248,224,1344,256,1392,272L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Centered Modal Popup moved to top level for proper z-index */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Dark Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowFilters(false)}
            />
            
            {/* Popup Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-[360px] lg:max-w-[1000px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {FilterContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full">
        {/* Top Header */}
        <div className="mb-6 sm:mb-8 relative z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e4f7ed] border border-[#bbf0d4] rounded-md mb-4 shadow-sm">
            <IconShoppingCart size={14} className="text-[#1B8A4D]" />
            <span className="text-[#1B8A4D] text-xs font-bold tracking-wider">EXPLORE OUR COLLECTION</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0d1c2f] to-[#1e3c72] mb-5 sm:mb-8 tracking-tight uppercase">
            PRODUCT LIST
          </h1>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 lg:gap-6 border-b border-gray-200/60 pb-3">
            <div className="w-full lg:flex-1 flex items-center min-w-0 overflow-hidden max-w-full">
              <CategoryNav
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto min-w-0 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Reset Filters Button */}
                <AnimatePresence>
                  {hasFilters && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8, w: 0 }}
                      animate={{ opacity: 1, scale: 1, w: "auto" }}
                      exit={{ opacity: 0, scale: 0.8, w: 0 }}
                      type="button"
                      onClick={resetFilters}
                      title="Reset Filters"
                      className="flex items-center justify-center w-[44px] h-[44px] bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 rounded-xl transition-colors shadow-sm shrink-0"
                    >
                      <IconRefresh className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>

                <motion.button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-1 items-center justify-center gap-2 px-4 sm:px-6 h-[44px] bg-white border border-gray-200 hover:border-green-400 rounded-xl text-sm font-bold transition-colors text-green-600 shadow-sm whitespace-nowrap w-full sm:w-auto shrink-0 relative"
                >
                  <IconFilter className="w-4 h-4 text-green-500" />
                  <span>Filters</span>
                  {hasFilters && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                    </span>
                  )}
                </motion.button>
              </div>
              
              {/* Search Bar */}
              <div className="relative flex-1 w-full min-w-0 lg:w-[260px] xl:w-[300px]">
                <IconSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 h-[44px] border border-gray-200 hover:border-green-300 rounded-xl text-sm focus:outline-none focus:border-green-500 transition-all bg-white text-gray-900 placeholder-gray-400 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Product Area */}
        <div className="w-full">
          {/* Product Grid Area */}
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 xl:gap-8 relative z-10"
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
    </div>
  );
}

export default ProductOverview;
