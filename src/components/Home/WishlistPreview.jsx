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

// Helper function to convert USD to INR (approximate rate: 1 USD = 83 INR)
const convertToRupees = (usdPrice) => {
  const rate = 83;
  return (parseFloat(usdPrice) * rate).toFixed(2);
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
    <section className="w-full bg-white py-12 md:py-16 lg:py-20">
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
              className="p-2 bg-red-100 rounded-lg"
            >
              <IconHeart className="w-6 h-6 md:w-7 md:h-7 text-red-600 fill-red-600" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                My Wishlist
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {wishlistCount} {wishlistCount === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {/* View All Button */}
          <motion.button
            onClick={() => router.push("/wishlist")}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
          >
            View All
            <IconArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {displayItems.map((item, index) => {
              const product = getProductDetails(item);
              const priceInRupees = convertToRupees(item.price);
              const originalPriceInRupees = item.originalPrice
                ? convertToRupees(item.originalPrice)
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
                  className="relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-[250px] md:h-[300px] bg-gray-100 overflow-hidden">
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
                      className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <IconX className="w-5 h-5 text-red-600" />
                    </motion.button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 pb-20">
                    <h3 className="text-gray-900 font-semibold text-base mb-2 line-clamp-2 min-h-12">
                      {item.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        ₹{priceInRupees}
                      </span>
                      {originalPriceInRupees && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{originalPriceInRupees}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick View and Add to Cart Buttons at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-2 z-20 shadow-lg">
                    <Button
                      type="default"
                      size="large"
                      icon={<IconEye className="w-4 h-4" />}
                      onClick={() => handleQuickView(item.id)}
                      className="flex-1 bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
                    >
                      Quick View
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<IconShoppingCart className="w-4 h-4" />}
                      onClick={() => handleAddToCart(product || item)}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700 border-none"
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
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
            >
              View All {wishlistCount} Items
              <IconArrowRight className="w-5 h-5" />
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
              <IconArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default WishlistPreview;
