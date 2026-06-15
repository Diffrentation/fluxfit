"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHeart, IconShoppingCart } from "@tabler/icons-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button, message } from "antd";

const ProductCard = ({ product, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const productId = product.id || product._id;
  const isWishlisted = isInWishlist(productId);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    if (product.inStock === false || product.stock === 0) {
      message.error(`${product.name} is currently out of stock`);
      return;
    }

    setIsAddingToCart(true);

    let selectedSize = product.sizes?.[0] || "One Size";
    let selectedColor = product.color || product.colors?.[0] || "default";

    if (product.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
      if (!defaultVariant || defaultVariant.stock === 0 || defaultVariant.isActive === false) {
        const availableVariant = product.variants.find(v => v.stock > 0 && v.isActive !== false);
        if (availableVariant) {
          selectedSize = availableVariant.size || selectedSize;
          selectedColor = availableVariant.color || selectedColor;
        } else {
          message.error(`${product.name} is completely out of stock`);
          setIsAddingToCart(false);
          return;
        }
      }
    }

    // Add to cart with auto-selected available options
    const success = addToCart(product, {
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    });

    if (success === false) {
      setIsAddingToCart(false);
      return;
    }

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

  const price = parseFloat(product.price).toFixed(2);

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
            className={`object-cover ${product.inStock === false || product.stock === 0 ? "opacity-60 grayscale" : ""}`}
          />
          {(product.inStock === false || product.stock === 0) && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
              <div className="bg-red-500 text-white px-4 py-2 rounded-sm font-bold tracking-wider transform -rotate-12 shadow-lg">
                OUT OF STOCK
              </div>
            </div>
          )}
        </motion.div>

        {/* Wishlist Icon */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (isInWishlist(productId)) {
              removeFromWishlist(productId);
              message.success(`${product.name} removed from wishlist`);
            } else {
              const success = addToWishlist(product);
              if (success !== false) {
                message.success(`${product.name} added to wishlist`);
              }
            }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
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
            ₹
            {parseFloat(price).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
                type={product.inStock === false || product.stock === 0 ? "default" : "primary"}
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2"
                size="large"
                loading={isAddingToCart}
                disabled={product.inStock === false || product.stock === 0}
                icon={product.inStock === false || product.stock === 0 ? null : <IconShoppingCart className="w-4 h-4" />}
              >
                {product.inStock === false || product.stock === 0 ? "Out of Stock" : (isAddingToCart ? "Adding..." : "Add to Cart")}
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
