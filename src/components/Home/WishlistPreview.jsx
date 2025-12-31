"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconHeart,
  IconShoppingCart,
  IconX,
  IconArrowRight,
  IconEye,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { productDatabase } from "@/lib/productDatabase";
import { Button, message } from "antd";

// Format price helper - prices are already in INR
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function WishlistPreview() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { wishlistItems, removeFromWishlist, getWishlistCount } = useWishlist();
  const [displayItems, setDisplayItems] = useState([]);

  // Update display items when wishlist changes
  useEffect(() => {
    // Show up to 4 items
    setDisplayItems(wishlistItems.slice(0, 4));
  }, [wishlistItems]);

  // Don't render if no items
  if (wishlistItems.length === 0) {
    return null;
  }

  const handleAddToCart = (product) => {
    addToCart(product, {
      size: product.sizes?.[0] || "One Size",
      color: product.color || product.colors?.[0] || "default",
      quantity: 1,
    });
    message.success(`${product.name} added to cart!`);
  };

  const handleQuickView = (productId) => {
    router.push(`/product-details/${productId}`);
  };

  const handleRemoveFromWishlist = (itemId, itemName) => {
    removeFromWishlist(itemId);
    message.success(`${itemName} removed from wishlist`);
  };

  const getProductDetails = (item) => {
    return productDatabase[item.id] || null;
  };

  const wishlistCount = getWishlistCount();

  return (
    <section className="w-full bg-white dark:bg-gray-900 py-8 sm:py-10 md:py-12 lg:py-14 transition-colors duration-300">
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
              className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"
            >
              <IconHeart className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 text-red-600 dark:text-red-400 fill-red-600 dark:fill-red-400" />
            </motion.div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                My Wishlist
              </h2>
              <p className="text-xs sm:text-sm md:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                {wishlistCount} {wishlistCount === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {/* View All Button */}
          <motion.button
            onClick={() => router.push("/wishlist")}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-800 transition-colors shadow-lg hover:shadow-xl"
          >
            View All
            <IconArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {displayItems.map((item, index) => {
              const product = getProductDetails(item);
              const price = parseFloat(item.price);
              const originalPrice = item.originalPrice
                ? parseFloat(item.originalPrice)
                : null;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-[200px] sm:h-[240px] md:h-[260px] lg:h-[280px] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={item.image || product?.images?.[0] || ""}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </motion.div>

                    {/* Remove from Wishlist Button */}
                    <motion.button
                      onClick={() =>
                        handleRemoveFromWishlist(item.id, item.name)
                      }
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <IconX className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </motion.button>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4 md:p-4 pb-20 sm:pb-24 md:pb-24">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base md:text-base mb-1.5 line-clamp-2 min-h-10">
                      {item.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl md:text-xl font-bold text-gray-900 dark:text-white">
                        ₹{formatPrice(price)}
                      </span>
                      {originalPrice && (
                        <span className="text-xs sm:text-sm md:text-sm text-gray-500 dark:text-gray-400 line-through">
                          ₹{formatPrice(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick View and Add to Cart Buttons at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2 z-20 shadow-lg">
                    <Button
                      type="default"
                      size="large"
                      icon={<IconEye className="w-4 h-4" />}
                      onClick={() => handleQuickView(item.id)}
                      className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm md:text-sm h-12 sm:h-14 md:h-14"
                    >
                      Quick View
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<IconShoppingCart className="w-4 h-4" />}
                      onClick={() => handleAddToCart(product || item)}
                      className="flex-1 bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 border-none text-xs sm:text-sm md:text-sm h-12 sm:h-14 md:h-14"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Mobile View All Button */}
        {wishlistCount > 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center mt-8 md:hidden"
          >
            <motion.button
              onClick={() => router.push("/wishlist")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-800 transition-colors shadow-lg hover:shadow-xl"
            >
              View All {wishlistCount} Items
              <IconArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* Desktop View All Button (if more than 4 items) */}
        {wishlistCount > 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden md:flex justify-center mt-8"
          >
            <motion.button
              onClick={() => router.push("/wishlist")}
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
            >
              View All {wishlistCount} Items
              <IconArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default WishlistPreview;
