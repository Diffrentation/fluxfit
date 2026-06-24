"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { IconHeart, IconShoppingCart, IconEye } from "@tabler/icons-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { message } from "antd";

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
    <div
      className="relative group cursor-pointer bg-white rounded-xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-[#f8f9fa] overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover object-top ${product.inStock === false || product.stock === 0 ? "opacity-60 grayscale" : ""}`}
          />
          {(product.inStock === false || product.stock === 0) && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-20">
              <div className="bg-red-500 text-white px-4 py-2 rounded-sm font-bold tracking-wider transform -rotate-12 shadow-lg">
                OUT OF STOCK
              </div>
            </div>
          )}
          {/* Inner gradient overlay for bottom text if needed, but the design is white bg */}
        </div>

        {/* Wishlist Icon */}
        <button
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
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-all hover:scale-110"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <IconHeart
            className={`w-5 h-5 transition-colors ${
              isWishlisted ? "fill-blue-500 text-blue-500" : "text-blue-500"
            }`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 bg-gradient-to-r from-white via-white to-[#e1f0ff] z-10">
        <h3 className="text-[#0d1c2f] font-bold text-base sm:text-lg mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[#00c0a3] font-bold text-lg mb-4">
          ₹{parseFloat(price).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        {/* Action Buttons (Always Visible) */}
        <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleQuickView}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-gray-200 text-green-600 hover:border-green-500 hover:bg-green-50 text-sm font-bold transition-colors whitespace-nowrap"
          >
            <IconEye size={18} /> Quick View
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.inStock === false || product.stock === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#1e9a58] hover:bg-[#188149] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isAddingToCart ? "Adding..." : (
              <>
                <IconShoppingCart size={18} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
