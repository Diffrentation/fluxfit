"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { productDatabase } from "@/lib/productDatabase";
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconShare,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button, message } from "antd";

// Helper function to convert USD to INR (approximate rate: 1 USD = 83 INR)
const convertToRupees = (usdPrice) => {
  const rate = 83;
  return (parseFloat(usdPrice) * rate).toFixed(2);
};

const CartPage = () => {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
  } = useCart();
  const [savedItems, setSavedItems] = useState([]);

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item.id, item.size, item.color);
      message.success("Item removed from cart");
    } else {
      updateQuantity(item.id, item.size, item.color, newQuantity);
    }
  };

  const handleDelete = (item) => {
    removeFromCart(item.id, item.size, item.color);
    message.success("Item removed from cart");
  };

  const handleSaveForLater = (item) => {
    setSavedItems([...savedItems, item]);
    removeFromCart(item.id, item.size, item.color);
    message.success("Item saved for later");
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
  const subtotalInRupees = convertToRupees(subtotal);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </motion.div>

        <div className="border-b border-gray-300 mb-6"></div>

        {/* Cart Items */}
        <div className="space-y-6 mb-8">
          <AnimatePresence>
            {cartItems.map((item, index) => {
              const product = getProductDetails(item);
              const discount = calculateDiscount(item);
              const itemPriceInRupees = convertToRupees(item.price);
              const itemTotalInRupees = convertToRupees(
                parseFloat(item.price) * item.quantity
              );
              const originalPriceInRupees = product?.originalPrice
                ? convertToRupees(product.originalPrice)
                : null;

              return (
                <motion.div
                  key={`${item.id}-${item.size}-${item.color}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Product Image */}
                    <div className="relative w-full md:w-48 h-64 md:h-48 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
                      <div className="mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h2>
                        {product?.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
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
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm text-green-600 font-medium">
                          In stock
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Fulfilled
                        </span>
                      </div>

                      {/* Color */}
                      {item.color && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">Colour:</span>{" "}
                            <span className="capitalize">{item.color}</span>
                          </span>
                        </div>
                      )}

                      {/* Size */}
                      {item.size && item.size !== "One Size" && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">Size:</span>{" "}
                            {item.size}
                          </span>
                        </div>
                      )}

                      {/* Price Section */}
                      <div className="mt-auto">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {discount && originalPriceInRupees && (
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
                              <span className="text-2xl font-bold text-gray-900">
                                ₹{itemTotalInRupees}
                              </span>
                              {originalPriceInRupees && (
                                <span className="text-sm text-gray-500 line-through">
                                  M.R.P.: ₹{originalPriceInRupees}
                                </span>
                              )}
                            </div>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-500 mt-1">
                                ₹{itemPriceInRupees} per item
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
                                  handleQuantityChange(item, item.quantity - 1)
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
                                handleQuantityChange(item, item.quantity + 1)
                              }
                              className="p-2 hover:bg-green-50 transition-colors text-green-600"
                              aria-label="Increase quantity"
                            >
                              <IconPlus className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Action Links */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleSaveForLater(item)}
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            Save for later
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/product-details/${item.id}`)
                            }
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            See more like this
                          </button>
                          <button
                            onClick={() => handleShare(item)}
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center gap-1"
                          >
                            <IconShare className="w-4 h-4" />
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

        {/* Subtotal Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-gray-300 pt-6"
        >
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"}):{" "}
                <span className="text-2xl">₹{subtotalInRupees}</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Taxes and shipping calculated at checkout
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CartPage;
