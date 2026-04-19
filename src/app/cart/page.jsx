"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { productDatabase } from "@/lib/productDatabase";
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconShare,
  IconArrowLeft,
  IconTag,
  IconX,
  IconShoppingCart,
} from "@tabler/icons-react";
import { Button, message, Input } from "antd";

// Format price helper - prices are already in INR
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const CartPage = () => {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
    addToCart,
  } = useCart();
  const { savedForLaterItems, addToSavedForLater, removeFromSavedForLater } =
    useWishlist();
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item.id, item.size, item.color, item.customization);
      message.success("Item removed from cart");
    } else {
      updateQuantity(
        item.id,
        item.size,
        item.color,
        newQuantity,
        item.customization
      );
    }
  };

  const handleDelete = (item) => {
    removeFromCart(item.id, item.size, item.color, item.customization);
    message.success("Item removed from cart");
  };

  const handleSaveForLater = (item) => {
    addToSavedForLater(item);
    removeFromCart(item.id, item.size, item.color, item.customization);
    message.success("Item saved for later");
  };

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

  const handleMoveToCart = (item) => {
    addToCart(productDatabase[item.id], {
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    });
    removeFromSavedForLater(item.id, item.size, item.color);
    message.success("Item moved to cart");
  };

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Check out this product: ${item.name}`,
        url: `${window.location.origin}/product-details/${item.id}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/product-details/${item.id}`
      );
      message.success("Product link copied to clipboard!");
    }
  };

  const getProductDetails = (item) => {
    return productDatabase[item.id] || null;
  };

  const calculateDiscount = (item) => {
    const product = getProductDetails(item);
    if (product && product.originalPrice) {
      const discount =
        ((parseFloat(product.originalPrice) - parseFloat(product.price)) /
          parseFloat(product.originalPrice)) *
        100;
      return Math.round(discount);
    }
    return null;
  };

  const totalItems = getCartCount();
  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const finalTotal = getFinalTotal();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 transition-colors duration-300">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-16 md:py-20"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Your cart is empty
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
              Looks like you haven&apos;t added anything to your cart yet.
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-8 sm:pb-12 transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Shopping Cart
          </h1>
        </motion.div>

        <div className="border-b border-gray-300 dark:border-gray-700 mb-4 sm:mb-6"></div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative">
          {/* Cart Items - Scrollable */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-0 sm:pr-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
              <AnimatePresence>
                {cartItems.map((item, index) => {
                  const product = getProductDetails(item);
                  const discount = calculateDiscount(item);
                  const itemPrice = parseFloat(item.price);
                  const itemTotal = itemPrice * item.quantity;
                  const originalPrice = product?.originalPrice
                    ? parseFloat(product.originalPrice)
                    : null;

                  return (
                    <motion.div
                      key={`${item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image */}
                        <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-40 md:h-48 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <Image
                            src={item.image || product?.images?.[0] || ""}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col">
                          {/* Product Name and Description */}
                          <div className="mb-2 sm:mb-3">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {item.name}
                            </h2>
                            {product?.description && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Best Seller Tag */}
                          {product?.rating && product.rating >= 4.5 && (
                            <div className="mb-3">
                              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                #1 Best Seller
                              </span>
                            </div>
                          )}

                          {/* Stock Status */}
                          <div className="mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                              In stock
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                              Fulfilled
                            </span>
                          </div>

                          {/* Color */}
                          {item.color && (
                            <div className="mb-2 sm:mb-3">
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Colour:</span>{" "}
                                <span className="capitalize">{item.color}</span>
                              </span>
                            </div>
                          )}

                          {/* Size */}
                          {item.size && item.size !== "One Size" && (
                            <div className="mb-2 sm:mb-3">
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Size:</span>{" "}
                                {item.size}
                              </span>
                            </div>
                          )}

                          {/* Price Section */}
                          <div className="mt-auto">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                {discount && originalPrice && (
                                  <div className="mb-2">
                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded mr-2">
                                      {discount}% off
                                    </span>
                                    <span className="text-xs text-red-600 font-semibold">
                                      Limited time deal
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    ₹{formatPrice(itemTotal)}
                                  </span>
                                  {originalPrice && (
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                                      M.R.P.: ₹{formatPrice(originalPrice)}
                                    </span>
                                  )}
                                </div>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ₹{formatPrice(itemPrice)} per item
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center border-2 border-yellow-400 rounded-lg overflow-hidden">
                                {item.quantity === 1 ? (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(item)}
                                    className="p-2 hover:bg-red-50 transition-colors text-red-600"
                                    aria-label="Delete item"
                                  >
                                    <IconTrash className="w-5 h-5" />
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      handleQuantityChange(
                                        item,
                                        item.quantity - 1
                                      )
                                    }
                                    className="p-2 hover:bg-orange-50 transition-colors text-orange-600"
                                    aria-label="Decrease quantity"
                                  >
                                    <IconMinus className="w-5 h-5" />
                                  </motion.button>
                                )}
                                <span className="px-4 py-2 font-semibold text-gray-900 border-x border-yellow-400 min-w-[60px] text-center">
                                  {item.quantity}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    handleQuantityChange(
                                      item,
                                      item.quantity + 1
                                    )
                                  }
                                  className="p-2 hover:bg-green-50 transition-colors text-green-600"
                                  aria-label="Increase quantity"
                                >
                                  <IconPlus className="w-5 h-5" />
                                </motion.button>
                              </div>
                            </div>

                            {/* Action Links */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleSaveForLater(item)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                              >
                                Save for later
                              </button>
                              <button
                                onClick={() =>
                                  router.push(`/product-details/${item.id}`)
                                }
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                              >
                                See more like this
                              </button>
                              <button
                                onClick={() => handleShare(item)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
                              >
                                <IconShare className="w-3 h-3 sm:w-4 sm:h-4" />
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Subtotal Section - Fixed on Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 shrink-0"
          >
            <div className="sticky top-20 sm:top-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Order Summary
                </h2>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-3 sm:mb-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Subtotal ({totalItems}{" "}
                      {totalItems === 1 ? "item" : "items"}):
                    </p>
                    <span className="text-lg sm:text-xl text-end font-bold text-gray-900 dark:text-white">
                      ₹{formatPrice(subtotal)}
                    </span>
                  </div>

                  {/* Coupon Section */}
                  <div className="space-y-2">
                    {appliedCoupon ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 sm:p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconTag className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-400">
                              {appliedCoupon.code}
                            </span>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          >
                            <IconX className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700 dark:text-green-400">
                            Discount:
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-green-800 dark:text-green-400">
                            -₹{formatPrice(discount)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onPressEnter={handleApplyCoupon}
                            className="flex-1"
                            prefix={
                              <IconTag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            }
                          />
                          <Button
                            onClick={handleApplyCoupon}
                            loading={isApplyingCoupon}
                            type="default"
                            className="w-full sm:w-auto"
                          >
                            Apply
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Try: WELCOME10, SAVE20, FLAT50, SUMMER25
                        </p>
                      </div>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        Total:
                      </p>
                      <span className="text-xl sm:text-2xl text-end font-bold text-blue-600 dark:text-blue-400">
                        ₹{formatPrice(finalTotal)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  Taxes and shipping calculated at checkout
                </p>
                <Button
                  type="primary"
                  size="large"
                  block
                  className="mb-4"
                  onClick={() => router.push("/checkout")}
                >
                  Proceed to Checkout
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
            </div>
          </motion.div>
        </div>

        {/* Saved for Later Section */}
        {savedForLaterItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 sm:mt-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Saved for Later ({savedForLaterItems.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {savedForLaterItems.map((item, index) => {
                const product = getProductDetails(item);
                const itemPrice = parseFloat(item.price);
                const itemTotal = itemPrice * item.quantity;

                return (
                  <motion.div
                    key={`${item.id}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <Image
                          src={item.image || product?.images?.[0] || ""}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {item.name}
                        </h3>
                        {item.size && item.size !== "One Size" && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Size: {item.size}
                          </p>
                        )}
                        {item.color && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 capitalize">
                            Color: {item.color}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
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
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
