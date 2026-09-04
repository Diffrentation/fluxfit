"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { IconHeart, IconShoppingCart, IconEye } from "@tabler/icons-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getVariantAwarePricing } from "@/lib/publicProductsApi";
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

  const pricing = getVariantAwarePricing(product, null);
  const price = pricing.price;
  const originalPrice = pricing.originalPrice;
  const discountPercent = pricing.discountPercent;

  return (
    <div
      className="relative group cursor-pointer bg-white rounded-xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/5] bg-[#f8f9fa] overflow-hidden">
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

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-[#1e9a58] text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            -{discountPercent}%
          </div>
        )}

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
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all hover:scale-110"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <IconHeart
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
              isWishlisted ? "fill-blue-500 text-blue-500" : "text-blue-500"
            }`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 bg-gradient-to-r from-white via-white to-[#e1f0ff] z-10">
        <h3 className="text-[#0d1c2f] font-bold text-xs sm:text-sm mb-1 line-clamp-2 min-h-[32px] sm:min-h-[36px] leading-snug">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mb-1.5 sm:mb-2">
          <span className="text-[#00c0a3] font-extrabold text-sm sm:text-base">
            ₹{price.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          {originalPrice && (
            <span className="text-xs sm:text-sm font-medium text-gray-500 line-through">
              ₹{originalPrice.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>

        {/* Action Buttons (Always Visible) */}
        <div className="mt-auto flex flex-col gap-1.5 pt-1.5 border-t border-gray-100">
          <button
            onClick={handleQuickView}
            className="w-full flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2 rounded-lg border border-gray-200 text-green-600 hover:border-green-500 hover:bg-green-50 text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap"
          >
            <IconEye size={14} className="shrink-0" /> Quick View
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.inStock === false || product.stock === 0}
            className="w-full flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2 rounded-lg bg-[#1e9a58] hover:bg-[#188149] text-white text-[11px] sm:text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
          >
            {isAddingToCart ? "Adding..." : (
              <>
                <IconShoppingCart size={14} className="shrink-0" /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
