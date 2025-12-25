"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHeart } from "@tabler/icons-react";
import Image from "next/image";

const ProductCard = ({ product, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <motion.div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Image Container */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gray-100 rounded-lg">
        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full h-full"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        </motion.div>

        {/* Wishlist Icon */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Add to wishlist"
        >
          <motion.div
            animate={{ scale: isWishlisted ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <IconHeart
              className={`w-5 h-5 transition-colors ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </motion.div>
        </motion.button>

        {/* Quick View Button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView?.(product);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-md hover:bg-gray-100 transition-colors"
              >
                Quick View
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Info */}
      <div className="mt-4">
        <h3 className="text-gray-900 font-medium text-lg mb-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-gray-700 font-semibold text-lg">
            ${product.price}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
