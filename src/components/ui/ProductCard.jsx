"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHeart, IconShoppingCart } from "@tabler/icons-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button, message } from "antd";

// Helper function to convert USD to INR (approximate rate: 1 USD = 83 INR)
const convertToRupees = (usdPrice) => {
  const rate = 83;
  return (parseFloat(usdPrice) * rate).toFixed(2);
};

const ProductCard = ({ product, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    setIsAddingToCart(true);
    
    // Add to cart with default options
    addToCart(product, {
      size: product.sizes?.[0] || "One Size",
      color: product.color || product.colors?.[0] || "default",
      quantity: 1,
    });

    message.success(`${product.name} added to cart!`, 2);

    // Animation feedback
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 600);
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    onQuickView?.(product);
  };

  const priceInRupees = convertToRupees(product.price);

  return (
    <motion.div
      className="relative group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Image Container */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gray-100">
        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-gray-900 font-medium text-lg mb-2 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-900 font-bold text-xl">
            ₹{priceInRupees}
          </p>
        </div>

        {/* Quick View and Add to Cart Buttons at Bottom */}
        <AnimatePresence mode="wait">
          {isHovered ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex gap-2"
            >
              <Button
                type="default"
                onClick={handleQuickView}
                className="flex-1 flex items-center justify-center gap-2"
                size="large"
              >
                Quick View
              </Button>
              <Button
                type="primary"
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2"
                size="large"
                loading={isAddingToCart}
                icon={<IconShoppingCart className="w-4 h-4" />}
              >
                {isAddingToCart ? "Adding..." : "Add to Cart"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="price-only"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-10"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProductCard;
