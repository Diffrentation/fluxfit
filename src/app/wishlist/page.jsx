"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { productDatabase } from "@/lib/productDatabase";
import {
  IconTrash,
  IconHeart,
  IconShoppingCart,
  IconTag,
  IconX,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button, message, Input } from "antd";

// Format price helper - prices are already in INR
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const WishlistPageContent = () => {
  const router = useRouter();
  const {
    addToCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
  } = useCart();
  const {
    wishlistItems,
    savedForLaterItems,
    removeFromWishlist,
    removeFromSavedForLater,
  } = useWishlist();
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [activeTab, setActiveTab] = useState("wishlist"); // 'wishlist' or 'saved'

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      message.warning("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    const result = applyCoupon(couponCode.trim());

    if (result.success) {
      message.success(result.message);
      setCouponCode("");
    } else {
      message.error(result.message);
    }

    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    message.success("Coupon removed");
  };

  const handleAddToCart = (product, options = {}) => {
    addToCart(product, {
      size: options.size || product.sizes?.[0] || "One Size",
      color: options.color || product.color || product.colors?.[0] || "default",
      quantity: options.quantity || 1,
    });
    message.success(`${product.name} added to cart!`);
  };

  const handleMoveToCart = (item) => {
    const product = productDatabase[item.id];
    if (product) {
      addToCart(product, {
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
      removeFromSavedForLater(item.id, item.size, item.color);
      message.success("Item moved to cart");
    }
  };

  const getProductDetails = (item) => {
    return productDatabase[item.id] || null;
  };

  const calculateWishlistTotal = () => {
    return wishlistItems.reduce(
      (total, item) => total + parseFloat(item.price),
      0
    );
  };

  const calculateSavedTotal = () => {
    return savedForLaterItems.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );
  };

  const getDiscountAmountForWishlist = () => {
    if (!appliedCoupon) return 0;
    const total = activeTab === "wishlist" ? calculateWishlistTotal() : calculateSavedTotal();
    if (appliedCoupon.type === "percentage") {
      return (total * appliedCoupon.discount) / 100;
    } else {
      return appliedCoupon.discount;
    }
  };

  const getFinalTotalForWishlist = () => {
    const total = activeTab === "wishlist" ? calculateWishlistTotal() : calculateSavedTotal();
    const discount = getDiscountAmountForWishlist();
    return Math.max(0, total - discount);
  };

  const allItemsEmpty = wishlistItems.length === 0 && savedForLaterItems.length === 0;

  if (allItemsEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <IconHeart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your wishlist is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Start adding items you love to your wishlist!
            </p>
            <Button
              type="primary"
              size="large"
              onClick={() => router.push("/")}
              icon={<IconArrowLeft className="w-4 h-4" />}
            >
              Continue Shopping
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const wishlistTotal = calculateWishlistTotal();
  const savedTotal = calculateSavedTotal();
  const currentTotal = activeTab === "wishlist" ? wishlistTotal : savedTotal;
  const discount = getDiscountAmountForWishlist();
  const finalTotal = getFinalTotalForWishlist();
  // Prices are already in INR - no conversion needed

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistItems.length} items in wishlist
            {savedForLaterItems.length > 0 &&
              ` • ${savedForLaterItems.length} saved for later`}
          </p>
        </motion.div>

        <div className="border-b border-gray-300 mb-6"></div>

        {/* Tabs */}
        {savedForLaterItems.length > 0 && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === "wishlist"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Wishlist ({wishlistItems.length})
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === "saved"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Saved for Later ({savedForLaterItems.length})
            </button>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex gap-6 relative">
          {/* Items Grid */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "wishlist" ? (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {wishlistItems.map((item, index) => {
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
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 group hover:shadow-lg transition-shadow"
                      >
                        <div className="relative w-full h-64 bg-gray-100">
                          <Image
                            src={item.image || product?.images?.[0] || ""}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          <button
                            onClick={() => {
                              removeFromWishlist(item.id);
                              message.success("Removed from wishlist");
                            }}
                            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors z-10"
                          >
                            <IconTrash className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-xl font-bold text-gray-900">
                              ₹{formatPrice(price)}
                            </span>
                            {originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{formatPrice(originalPrice)}
                              </span>
                            )}
                          </div>
                          <Button
                            type="primary"
                            block
                            icon={<IconShoppingCart className="w-4 h-4" />}
                            onClick={() => handleAddToCart(product || item)}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {savedForLaterItems.map((item, index) => {
                    const product = getProductDetails(item);
                    const itemPrice = parseFloat(item.price);
                    const itemTotal = itemPrice * item.quantity;

                    return (
                      <motion.div
                        key={`${item.id}-${item.size}-${item.color}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
                      >
                        <div className="flex gap-4">
                          <div className="relative w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={item.image || product?.images?.[0] || ""}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                              {item.name}
                            </h3>
                            {item.size && item.size !== "One Size" && (
                              <p className="text-xs text-gray-600 mb-1">
                                Size: {item.size}
                              </p>
                            )}
                            {item.color && (
                              <p className="text-xs text-gray-600 mb-2 capitalize">
                                Color: {item.color}
                              </p>
                            )}
                            <p className="text-sm font-bold text-gray-900 mb-3">
                              ₹{formatPrice(itemTotal)}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="small"
                                type="primary"
                                icon={<IconShoppingCart className="w-4 h-4" />}
                                onClick={() => handleMoveToCart(item)}
                                className="flex-1"
                              >
                                Move to Cart
                              </Button>
                              <Button
                                size="small"
                                danger
                                icon={<IconTrash className="w-4 h-4" />}
                                onClick={() => {
                                  removeFromSavedForLater(
                                    item.id,
                                    item.size,
                                    item.color
                                  );
                                  message.success("Item removed");
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Summary Sidebar */}
          {(wishlistItems.length > 0 || savedForLaterItems.length > 0) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-80 shrink-0"
            >
              <div className="sticky top-24 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Summary
                </h2>

                <div className="border-b border-gray-200 pb-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">Subtotal:</p>
                    <span className="text-xl text-end font-bold text-gray-900">
                      ₹{formatPrice(currentTotal)}
                    </span>
                  </div>

                  {/* Coupon Section */}
                  <div className="space-y-2">
                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconTag className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">
                              {appliedCoupon.code}
                            </span>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-green-600 hover:text-green-800"
                          >
                            <IconX className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700">Discount:</span>
                          <span className="text-sm font-bold text-green-800">
                            -₹{formatPrice(discount)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onPressEnter={handleApplyCoupon}
                            className="flex-1"
                            prefix={<IconTag className="w-4 h-4 text-gray-400" />}
                          />
                          <Button
                            onClick={handleApplyCoupon}
                            loading={isApplyingCoupon}
                            type="default"
                          >
                            Apply
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Try: WELCOME10, SAVE20, FLAT50, SUMMER25
                        </p>
                      </div>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <p className="text-lg font-bold text-gray-900">Total:</p>
                      <span className="text-2xl text-end font-bold text-blue-600">
                        ₹{formatPrice(finalTotal)}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    if (activeTab === "wishlist") {
                      wishlistItems.forEach((item) => {
                        const product = getProductDetails(item);
                        if (product) {
                          handleAddToCart(product);
                        }
                      });
                      message.success("All items added to cart!");
                    } else {
                      savedForLaterItems.forEach((item) => {
                        handleMoveToCart(item);
                      });
                    }
                  }}
                  disabled={
                    (activeTab === "wishlist" && wishlistItems.length === 0) ||
                    (activeTab === "saved" && savedForLaterItems.length === 0)
                  }
                  className="mb-4"
                >
                  {activeTab === "wishlist"
                    ? "Add All to Cart"
                    : "Move All to Cart"}
                </Button>
                <Button
                  type="default"
                  size="large"
                  block
                  onClick={() => router.push("/")}
                >
                  Continue Shopping
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistPageContent />
    </ProtectedRoute>
  );
}

